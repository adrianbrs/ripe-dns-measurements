<template>
  <v-row>
    <v-col cols="12" md="4">
      <v-text-field
        v-model="id"
        label="ID da medição (IPv4)"
        :rules="rules"
        :disabled="loading"
        placeholder="00000"
        v-mask="'############'"
        append-icon="mdi-identifier"
        hide-details="auto"
        outlined
      ></v-text-field>
    </v-col>

    <v-col cols="12" md="4">
      <v-datetime-picker
        label="Data inicial"
        :disabled="loading"
        :date-format="dateFormat"
        :time-format="timeFormat"
        :text-field-props="textProps"
        :date-picker-props="dateProps"
        :time-picker-props="timeProps"
        :datetime.sync="startDate"
        @input="datesChange"
        v-model="startDate"
      >
        <template #dateIcon>
          <v-icon>mdi-calendar</v-icon>
        </template>
        <template #timeIcon>
          <v-icon>mdi-clock-outline</v-icon>
        </template>
        <template slot="actions" slot-scope="{ parent }">
          <v-btn color="success" text @click="parent.okHandler">Ok</v-btn>
        </template>
      </v-datetime-picker>
    </v-col>

    <v-col cols="12" md="4">
      <v-datetime-picker
        label="Data final"
        :disabled="loading"
        :date-format="dateFormat"
        :time-format="timeFormat"
        :text-field-props="textProps"
        :date-picker-props="dateProps"
        :time-picker-props="timeProps"
        @input="datesChange"
        v-model="endDate"
      >
        <template #dateIcon>
          <v-icon>mdi-calendar</v-icon>
        </template>
        <template #timeIcon>
          <v-icon>mdi-clock-outline</v-icon>
        </template>
        <template slot="actions" slot-scope="{ parent }">
          <v-btn color="success" text @click="parent.okHandler">Ok</v-btn>
        </template>
      </v-datetime-picker>
    </v-col>

    <v-col cols="12" class="text-center">
      <span>Período: {{ dateRange }}</span>
    </v-col>

    <v-col cols="12">
      <v-btn
        :color="loading ? 'red' : 'primary'"
        block
        :disabled="!id || !startDate || !endDate"
        @click="search()"
      >
        <!-- Cancelar -->
        <template v-if="loading">
          <v-progress-circular
            indeterminate
            color="white"
            size="22"
            width="2"
            class="mr-2"
          ></v-progress-circular>

          Cancelar
        </template>

        <!-- Buscar -->
        <template v-else>
          <v-icon left>mdi-magnify</v-icon>
          Buscar
        </template>
      </v-btn>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Inject, Prop, Vue, Watch } from "vue-property-decorator";
import { MeasurementEntry, Measurements } from "@/interfaces/result.interface";
import axios from "axios";
import dayjs from "dayjs";

const BASE_URL = "https://atlas.ripe.net/api/v2/measurements";
const LIMIT_DAYS = 10;

@Component
export default class AppUploader extends Vue {
  @Prop(Boolean)
  value!: boolean;

  @Prop(Boolean)
  doSearch!: boolean;

  @Inject()
  snackbar: (msg: string, color?: string) => void;

  id: string | null = "10313";
  startDate: Date;
  endDate: Date;
  dateRange = "-";

  rules = [(v: string): unknown => !!v || "ID obrigatório"];
  controller = new AbortController();

  dateFormat = "dd/MM/yyyy";
  timeFormat = "HH:mm:ss";
  dateProps = {
    locale: "pt-BR",
  };
  timeProps = {
    useSeconds: true,
    format: "24hr",
  };
  textProps = {
    appendIcon: "mdi-calendar-outline",
    outlined: true,
    hideDetails: "auto",
  };

  get loading(): boolean {
    return !!this.value;
  }
  set loading(loading: boolean) {
    this.$emit("input", loading);
  }

  @Watch("doSearch")
  watchDoSearch(search: boolean): void {
    if (search) {
      this.search();
    }
  }

  datesChange(): void {
    this.dateRange = this.getDateRange();
  }

  getDateRange(): string {
    const diff = dayjs(this.endDate).diff(this.startDate);
    return dayjs.duration(diff).format("D[d] H[h] m[m] s[s]");
  }

  created(): void {
    const now = dayjs();
    const before = now.subtract(
      dayjs.duration(10, "minutes").asSeconds(),
      "seconds"
    );

    this.startDate = before.toDate();
    this.endDate = now.toDate();
    this.dateRange = this.getDateRange();
  }

  async mounted(): Promise<void> {
    if (this.doSearch) {
      await this.search();
    }
  }

  success(result: MeasurementEntry[]): void {
    this.$emit("load", result);
  }

  cancel(): void {
    this.controller.abort();
    this.controller = new AbortController();
    this.snackbar("Busca cancelada");
  }

  getV6IdFromV4(v4Id: string): string {
    return String(parseInt(v4Id) + 1000);
  }

  fetch(id: string, version: number): Promise<MeasurementEntry[]> {
    return axios
      .get(`${BASE_URL}/${id}/results`, {
        params: {
          start: this.startDate,
          stop: this.endDate,
          format: "json",
        },
        signal: this.controller.signal,
        onDownloadProgress: (event: ProgressEvent<XMLHttpRequest>) => {
          this.$emit("progress", version, event.loaded);
        },
      })
      .then((res) => {
        const { data } = res;
        this.$emit(`load:ipv${version}`, data);
        return data;
      })
      .catch((err) => {
        if (String(err.response?.status) === "404") {
          this.snackbar("Medição não encontrada: " + id, "error");
        }
        console.error(err);
        return Promise.reject(err);
      });
  }

  async search(): Promise<void> {
    if (this.loading) {
      this.cancel();
      return;
    }

    if (this.id && this.startDate && this.endDate) {
      // Valida o limite em dias para busca
      const diff = dayjs(this.startDate).diff(this.endDate, "days");
      if (diff > LIMIT_DAYS) {
        this.snackbar("O limite máximo em dias é " + LIMIT_DAYS, "error");
        return;
      }

      this.$emit("load", null);
      this.loading = true;

      // IPv4
      const ipv4Req = this.fetch(this.id, 4);
      const ipv6Req = this.fetch(this.getV6IdFromV4(this.id), 6);

      await Promise.all([ipv4Req, ipv6Req])
        .then(([ipv4, ipv6]) => {
          const results: Measurements = { ipv4, ipv6 };
          this.$emit("load", results);
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }
}
</script>
