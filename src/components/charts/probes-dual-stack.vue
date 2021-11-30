<template>
  <v-skeleton-loader
    class="mx-auto"
    type="card"
    height="400"
    :loading="loading"
  >
    <v-card>
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

    const ipv4Ids = new Set(ipv4.map((res) => res.prb_id));
    const dualStacks = ipv6.filter((res) => ipv4Ids.has(res.prb_id));

    // series.data = seriesData;

    this.loading = false;
  }

  getLocation(data: string): string {
    return data.split(".")?.[1]?.toUpperCase() ?? null;
  }
}
</script>
