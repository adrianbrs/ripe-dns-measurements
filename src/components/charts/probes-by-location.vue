<template>
  <v-skeleton-loader class="mx-auto" type="card" :loading="loading">
    <v-card>
      <highcharts :options="chartOptions"></highcharts>
    </v-card>
  </v-skeleton-loader>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { MeasurementEntry } from "@/interfaces/result.interface";
import { Chart } from "highcharts-vue";
import Highcharts from "highcharts";

@Component({
  components: { highcharts: Chart },
})
export default class AppProbesByLocation extends Vue {
  @Prop({
    type: [Array],
  })
  result!: MeasurementEntry[] | null;

  @Prop({
    type: Number,
    default: 4,
  })
  ipVersion!: 4 | 6;

  loading = true;

  chartOptions: Highcharts.Options = {
    chart: {
      type: "pie",
    },
    title: {
      text: `1. Distribuição das Probes por localidade: IPv${this.ipVersion}`,
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

  @Watch("result", {
    immediate: true,
  })
  watchResult(): void {
    this.updateSeries();
  }

  updateSeries(): void {
    this.loading = true;
    const series = this.chartOptions.series[0] as Highcharts.SeriesPieOptions;

    if (!this.result) {
      series.data = [];
      return;
    }
    const group = {} as Record<string, number>;

    for (const entry of this.result) {
      const code = entry.result?.answers?.[0]?.RDATA?.[0];

      if (code) {
        const location = this.getLocation(code);
        group[location] = (group[location] ?? 0) + 1;
      }
    }

    const seriesData = Object.entries(group).map(([name, y]) => ({ name, y }));
    series.data = seriesData;

    this.loading = false;
  }

  getLocation(data: string): string {
    return data.split(".")?.[1]?.toUpperCase() ?? null;
  }
}
</script>
