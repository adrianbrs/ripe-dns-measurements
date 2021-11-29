<template>
  <v-row>
    <!-- Table -->
    <v-col cols="12">
      <v-skeleton-loader
        v-if="loading"
        class="mx-auto"
        type="table-thead, divider, table-row"
      ></v-skeleton-loader>

      <v-simple-table v-else>
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">Entradas</th>
              <th class="text-left">ID Medição</th>
              <th class="text-left">Nome Medição</th>
              <th class="text-left">End. Destino</th>
              <th class="text-left">Porta Destino</th>
              <th class="text-left">Tipo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ result.length || "-" }}</td>
              <td>{{ sample.msm_id || "-" }}</td>
              <td>{{ sample.msm_name || "-" }}</td>
              <td>{{ sample.dst_addr || "-" }}</td>
              <td>{{ sample.dst_port || "-" }}</td>
              <td>{{ sample.type || "-" }}</td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-col>
    <v-col cols="12" lg="4">
      <v-skeleton-loader class="mx-auto" type="card"></v-skeleton-loader>
    </v-col>

    <v-col cols="12" lg="4">
      <v-skeleton-loader class="mx-auto" type="card"></v-skeleton-loader>
    </v-col>

    <v-col cols="12" lg="4">
      <v-skeleton-loader class="mx-auto" type="card"></v-skeleton-loader>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { MeasurementEntry } from "@/interfaces/result.interface";

@Component
export default class AppUploader extends Vue {
  @Prop(Array)
  result!: MeasurementEntry[];

  loading = true;
  sample: MeasurementEntry | null = null;

  @Watch("result", {
    immediate: true,
  })
  watchResult(result: MeasurementEntry[]): void {
    this.processResult(result);
  }

  processResult(result: MeasurementEntry[]): void {
    this.loading = true;
    if (!result || !result.length) {
      this.sample = null;
      this.loading = false;
      return;
    }

    const samples = result.slice().sort((a, b) => {
      let res = 0;
      if (a.msm_id && !b.msm_id) res--;
      else if (!a.msm_id && b.msm_id) res++;
      if (a.msm_name && !b.msm_name) res--;
      else if (!a.msm_name && b.msm_name) res++;
      if (a.dst_addr && !b.dst_addr) res--;
      else if (!a.dst_addr && b.dst_addr) res++;
      if (a.dst_port && !b.dst_port) res--;
      else if (!a.dst_port && b.dst_port) res++;
      if (a.type && !b.type) res--;
      else if (!a.type && b.type) res++;

      return res;
    });

    this.loading = false;
    this.sample = samples[0];
    console.log(this.sample);
  }
}
</script>
