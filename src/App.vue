<template>
  <v-app>
    <v-app-bar class="px-4" color="primary" dark extended flat absolute>
      <v-icon class="mr-4">mdi-dns-outline</v-icon>
      <v-toolbar-title>
        <strong>Visualizador de análise de tráfego DNS</strong> · RIPE Atlas
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn>
        Código Fonte
        <v-icon right>mdi-github</v-icon>
      </v-btn>
    </v-app-bar>

    <v-card class="main-card mx-auto" max-width="900" width="100%">
      <v-tabs v-model="tab">
        <v-tooltip bottom>
          Faça upload do resultado da medição (JSON)

          <template #activator="{ on }">
            <v-tab v-on="on">
              <v-icon>mdi-cloud-upload</v-icon>
            </v-tab>
          </template>
        </v-tooltip>

        <v-tooltip bottom>
          Busque uma medição através de um ID

          <template #activator="{ on }">
            <v-tab v-on="on">
              <v-icon>mdi-magnify</v-icon>
            </v-tab>
          </template>
        </v-tooltip>
      </v-tabs>

      <v-divider></v-divider>

      <v-tabs-items v-model="tab">
        <v-tab-item>
          <v-card-text>
            <app-uploader
              v-model="loading"
              @load="onLoad"
              @unload="onUnload"
            ></app-uploader>
          </v-card-text>
        </v-tab-item>

        <v-tab-item>
          <v-card-text>
            <app-fetcher
              v-model="loading"
              @load="onLoad"
              @unload="onUnload"
              @progress="onProgress"
            ></app-fetcher>
          </v-card-text>
        </v-tab-item>
      </v-tabs-items>
    </v-card>

    <v-main>
      <v-container class="main-container" fill-height>
        <!-- Nenhum resultado ainda -->
        <v-fade-transition mode="out-in">
          <v-row v-if="loading">
            <v-col cols="12" class="text-center">
              <v-progress-circular size="100" color="primary" indeterminate>
                <!-- <v-icon>mdi-cogs</v-icon> -->
                <small>{{ progressText }}</small>
              </v-progress-circular>
            </v-col>
          </v-row>
          <v-row v-else-if="!result || !result.length">
            <v-col cols="12" class="text-center">
              <v-icon x-large class="mb-6">mdi-code-json</v-icon>
              <h2>Selecione uma medição para visualizar.</h2>
            </v-col>
          </v-row>

          <!-- Carrega os charts -->
          <app-summary v-else :result="result"></app-summary>
        </v-fade-transition>
      </v-container>
    </v-main>

    <v-footer app padless>
      <v-col class="text-center" cols="12">
        <span>
          Adrian Cerbaro &middot; Universidade de Passo Fundo &middot; 2021/2
        </span>

        &middot;

        <a href="https://github.com/adrianbrs" target="_blank">GitHub</a>
      </v-col>
    </v-footer>

    <v-snackbar v-model="snackbarData.show" top :color="snackbarData.color">
      {{ snackbarData.message }}

      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbarData.show = false">Ok</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script lang="ts">
import { Component, Provide, Vue, Watch } from "vue-property-decorator";
import AppUploader from "@/components/Uploader.vue";
import AppFetcher from "@/components/Fetcher.vue";
import AppSummary from "@/components/Summary.vue";
import { MeasurementEntry } from "./interfaces/result.interface";

@Component({
  components: { AppUploader, AppFetcher, AppSummary },
  provide() {
    return {
      snackbar: this.showSnack,
    };
  },
})
export default class App extends Vue {
  name = "App";
  tab = "upload";
  loading = false;
  progress = 0;
  snackbarData = {
    show: false,
    message: null,
    color: null,
  };

  result: MeasurementEntry[] | null = null;

  get progressText(): string {
    return this.formatBytes(this.progress);
  }

  @Watch("result")
  watchResult(): void {
    this.progress = 0;
  }

  @Provide()
  snackbar(message: string, color?: string): void {
    this.snackbarData = {
      show: true,
      message,
      color,
    };
  }

  onLoad(result: MeasurementEntry[]): void {
    if (!result) {
      this.snackbar("Algo deu errado ao carregar os resultados");
    } else if (!result.length) {
      this.snackbar("Nenhuma entrada encontrada");
    }

    this.result = result;
  }

  onUnload(): void {
    this.result = null;
  }

  onProgress(loaded: number): void {
    this.progress = loaded;
  }

  formatBytes(bytes, decimals = 2): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }
}
</script>

<style lang="scss" scoped>
.main {
  &-card {
    z-index: 2;
    margin-top: 64px;
  }
}
</style>
