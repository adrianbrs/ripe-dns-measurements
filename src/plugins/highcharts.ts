import Vue from "vue";
import Highcharts from "highcharts";
import HighchartsVue from "highcharts-vue";

Vue.use(HighchartsVue);

// Apply the dark blue theme
Highcharts.setOptions({
  chart: {
    backgroundColor: null,
    plotBackgroundColor: null,
    plotBorderColor: null,
    plotShadow: false,
    spacing: [28, 28, 32, 28],
  },
  title: {
    align: "center",
    margin: 36,
    style: {
      color: "#fff",
      fontWeight: "bold",
    },
  },
  legend: {
    itemStyle: {
      color: "#CCC",
    },
    itemHoverStyle: {
      color: "#FFF",
    },
    itemHiddenStyle: {
      color: "#444",
    },
  },
  tooltip: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    style: {
      color: "#F0F0F0",
    },
  },
  plotOptions: {
    pie: {
      dataLabels: {
        color: "#fff",
      },
    },
  },
  credits: {
    enabled: false,
  },
});
