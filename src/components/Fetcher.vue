<template>
  <v-row>
    <v-col cols="12" md="4">
      <v-text-field
        v-model="id"
        label="ID da medição"
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
        v-model="timeStart"
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
        v-model="timeEnd"
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

    <v-col cols="12">
      <v-btn
        :color="loading ? 'red' : 'primary'"
        block
        :disabled="!id || !timeStart || !timeEnd"
        @click="loading ? cancel() : search()"
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
import { Component, Inject, Prop, Vue } from "vue-property-decorator";
import { MeasurementEntry } from "@/interfaces/result.interface";
import axios, { AxiosResponse } from "axios";
import dayjs from "dayjs";

const BASE_URL = "https://atlas.ripe.net/api/v2/measurements";
const LIMIT_DAYS = 10;

@Component
export default class AppUploader extends Vue {
  @Prop(Boolean)
  value!: boolean;

  @Inject()
  snackbar: (msg: string, color?: string) => void;

  id: string | null = null;
  timeStart!: Date;
  timeEnd!: Date;

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

  created(): void {
    const now = dayjs();
    const after = now.add(30, "seconds");

    this.timeStart = now.toDate();
    this.timeEnd = after.toDate();
  }

  success(result: MeasurementEntry[]): void {
    this.$emit("load", result);
  }

  cancel(): void {
    this.controller.abort();
    this.snackbar("Busca cancelada");
  }

  async search(): Promise<void> {
    if (this.id && this.timeStart && this.timeEnd) {
      // Valida o limite em dias para busca
      const diff = dayjs(this.timeStart).diff(this.timeEnd, "days");
      if (diff > LIMIT_DAYS) {
        this.snackbar("O limite máximo em dias é " + LIMIT_DAYS, "error");
        return;
      }

      this.loading = true;

      await axios
        .get(`${BASE_URL}/${this.id}/results`, {
          params: {
            start: this.timeStart,
            stop: this.timeEnd,
            format: "json",
          },
          signal: this.controller.signal,
          onDownloadProgress: (event: ProgressEvent<XMLHttpRequest>) => {
            this.$emit("progress", event.loaded);
          },
        })
        .then((res) => {
          this.success(res.data);
        })
        .catch((err) => {
          if (String(err.response?.status) === "404") {
            this.snackbar("Medição não encontrada", "error");
          }
          console.error(err, err.response.status);
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }
}
</script>
