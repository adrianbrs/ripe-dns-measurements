<template>
  <v-row>
    <!-- Table -->
    <v-col cols="12">
      <v-skeleton-loader
        class="mx-auto"
        type="table-thead, divider, table-row"
        :loading="loading"
      >
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left">Entradas IPv4</th>
                <th class="text-left">Entradas IPv6</th>
                <th class="text-left">ID Medição</th>
                <th class="text-left">Nome Medição</th>
                <th class="text-left">End. Destino</th>
                <th class="text-left">Porta Destino</th>
                <th class="text-left">Tipo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ results.ipv4.length || "-" }}</td>
                <td>{{ results.ipv6.length || "-" }}</td>
                <td>{{ sample.msm_id || "-" }}</td>
                <td>{{ sample.msm_name || "-" }}</td>
                <td>{{ sample.dst_addr || "-" }}</td>
                <td>{{ sample.dst_port || "-" }}</td>
                <td>{{ sample.type || "-" }}</td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-skeleton-loader>
    </v-col>

    <v-col cols="12" lg="6" xl="4">
      <app-probes-by-location
        :result="results ? results.ipv4 : null"
        :ip-version="4"
      ></app-probes-by-location>
    </v-col>

    <v-col cols="12" lg="6" xl="4">
      <app-probes-by-location
        :result="results ? results.ipv6 : null"
        :ip-version="6"
      ></app-probes-by-location>
    </v-col>

    <v-col cols="12" lg="12" xl="4">
      <app-probes-dual-stack :results="results"></app-probes-dual-stack>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { MeasurementEntry, Measurements } from "@/interfaces/result.interface";
import AppProbesByLocation from "@/components/charts/probes-by-location.vue";
import AppProbesDualStack from "@/components/charts/probes-dual-stack.vue";

@Component({
  components: { AppProbesByLocation, AppProbesDualStack },
})
export default class AppUploader extends Vue {
  @Prop({
    type: Object,
  })
  results!: Measurements | null;

  loading = true;
  sample: MeasurementEntry | null = null;

  @Watch("results", {
    immediate: true,
  })
  watchResult(results: Measurements): void {
    this.processResult(results);
  }

  processResult(results: Measurements): void {
    this.loading = true;
    if (!results?.ipv4 || !results?.ipv6) {
      return;
    }
    const result = results.ipv4;

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
  }
}
</script>
