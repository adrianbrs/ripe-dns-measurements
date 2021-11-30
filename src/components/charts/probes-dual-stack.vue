<template>
  <v-skeleton-loader
    class="mx-auto"
    type="card"
    height="400"
    :loading="loading"
  >
    <v-card class="d-flex justify-center">
      <highcharts :options="chartOptions"></highcharts>
    </v-card>
  </v-skeleton-loader>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Measurements } from "@/interfaces/result.interface";
import { Chart } from "highcharts-vue";
import Highcharts from "highcharts";

@Component({
  components: { highcharts: Chart },
})
export default class AppProbesDualStack extends Vue {
  @Prop({
    type: [Object],
  })
  results!: Measurements | null;

  loading = true;

  chartOptions: Highcharts.Options = {
    chart: {
      type: "pie",
    },
    title: {
      text: `2. Respostas IPv4 e IPv6`,
    },
    tooltip: {
      headerFormat: "",
      pointFormat: "{point.name}: <b>{point.percentage:.1f}%</b>",
    },
    accessibility: {
      point: {
        valueSuffix: "%",
      },
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.percentage:.1f} %",
        },
      },
    },
    series: [
      {
        type: "pie",
        name: "Locais",
        colorByPoint: true,
        data: [],
      },
    ],
  };

  @Watch("results", {
    immediate: true,
  })
  watchResult(): void {
    this.updateSeries();
  }

  updateSeries(): void {
    this.loading = true;
    const series = this.chartOptions.series[0] as Highcharts.SeriesPieOptions;

    if (!this.results) {
      series.data = [];
      return;
    }

    const { ipv4, ipv6 } = this.results;
    const sameLocProbes = new Set<number>();

    const ipv4Ids = new Set(ipv4.map((res) => res.prb_id));
    const ipv6Ids = new Set(ipv6.map((res) => res.prb_id));
    const dsIpv4 = ipv4.filter((res) => ipv6Ids.has(res.prb_id));
    const dsIpv6 = ipv6.filter((res) => ipv4Ids.has(res.prb_id));

    const uniqueProbes = new Set([
      ...Array.from(ipv4Ids),
      ...Array.from(ipv6Ids),
    ]);
    const locIpv4 = new Map<number, Set<string>>();

    // IPv4 map
    for (const res of dsIpv4) {
      if (!locIpv4.has(res.prb_id)) {
        locIpv4.set(res.prb_id, new Set());
      }
      const loc = res.result?.answers?.[0]?.RDATA?.[0];
      if (!loc) continue;

      const locName = this.getLocation(loc);
      locIpv4.get(res.prb_id).add(locName);
    }

    for (const res of dsIpv6) {
      const loc = res.result?.answers?.[0]?.RDATA?.[0];
      if (!loc) continue;

      const locName = this.getLocation(loc);
      const ipv4locs = locIpv4.get(res.prb_id);

      if (ipv4locs && ipv4locs.has(locName)) {
        sameLocProbes.add(res.prb_id);
      }
    }

    series.data = [
      {
        name: "IPv4 == IPv6",
        y: sameLocProbes.size,
      },
      {
        name: "IPv4 != IPv6",
        y: uniqueProbes.size - sameLocProbes.size,
      },
    ];

    this.loading = false;
  }

  // TODO criar opção para modificar esse método
  getLocation(data: string): string {
    return data.split(".")?.[1]?.toUpperCase() ?? null;
  }
}
</script>
