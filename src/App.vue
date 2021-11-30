<template>
  <v-app>
    <v-app-bar class="px-4" color="primary" dark extended flat absolute>
      <v-icon class="mr-4">mdi-dns-outline</v-icon>
      <v-toolbar-title>
        <strong>Visualizador de análise de tráfego DNS</strong> · RIPE Atlas
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn
        href="https://github.com/adrianbrs/ripe-dns-measurements"
        target="_blank"
      >
        Código Fonte
        <v-icon right>mdi-github</v-icon>
      </v-btn>
    </v-app-bar>

    <v-card class="main-card mx-auto" max-width="900" width="100%">
      <v-tabs v-model="tab">
        <v-tooltip bottom>
          Busque uma medição através de um ID

          <template #activator="{ on }">
            <v-tab href="#tab-search" v-on="on">
              <v-icon>mdi-magnify</v-icon>
            </v-tab>
          </template>
        </v-tooltip>

        <v-tooltip bottom>
          Faça upload do resultado da medição (JSON)

          <template #activator="{ on }">
            <v-tab href="#tab-upload" v-on="on">
              <v-icon>mdi-cloud-upload</v-icon>
            </v-tab>
          </template>
        </v-tooltip>
      </v-tabs>

      <v-divider></v-divider>

      <v-tabs-items v-model="tab">
        <v-tab-item value="tab-search">
          <v-card-text>
            <app-fetcher
              v-model="loading"
              :do-search="doSearch"
              @load="onLoad"
              @unload="onUnload"
              @progress="onProgress"
            ></app-fetcher>
          </v-card-text>
        </v-tab-item>

        <v-tab-item value="tab-upload">
          <v-card-text>
            <app-uploader
              v-model="loading"
              @load="onLoad"
              @unload="onUnload"
              @progress="onProgress"
            ></app-uploader>
          </v-card-text>
        </v-tab-item>
      </v-tabs-items>
    </v-card>

    <v-main>
      <v-container class="main-container" fill-height>
        <!-- Nenhum resultado ainda -->
        <v-fade-transition mode="out-in">
          <!-- Carregando -->
          <v-row v-if="loading">
            <v-col class="text-center">
              <v-progress-circular size="150" color="primary" indeterminate>
                <div class="d-flex flex-column">
                  <div class="d-flex">
                    <small class="mr-3">IPv4:</small>
                    <small>{{ progressText4 }}</small>
                  </div>

                  <div class="d-flex">
                    <small class="mr-3">IPv6:</small>
                    <small>{{ progressText6 }}</small>
                  </div>
                </div>
              </v-progress-circular>
            </v-col>
          </v-row>

          <!-- Nada selecionado -->
          <v-row v-else-if="emptyResults">
            <v-col cols="12" class="text-center">
              <v-icon x-large class="mb-6">mdi-code-json</v-icon>
              <h2>Selecione uma medição para visualizar.</h2>
            </v-col>
          </v-row>

          <!-- Carrega os charts -->
          <app-summary v-else :results="results"></app-summary>
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
import { Measurements } from "./interfaces/result.interface";
import AppUploader from "@/components/uploader/uploader.vue";
import AppFetcher from "@/components/fetcher.vue";
import AppSummary from "@/components/summary.vue";

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
  progress4 = 0;
  progress6 = 0;
  doSearch = true;
  snackbarData = {
    show: false,
    message: null,
    color: null,
  };

  results: Measurements | null = null;

  get progressText4(): string {
    return this.formatBytes(this.progress4);
  }

  get progressText6(): string {
    return this.formatBytes(this.progress6);
  }

  get emptyResults(): boolean {
    return !this.results?.ipv4?.length || !this.results?.ipv6?.length;
  }

  @Watch("loading")
  watchLoading(loading: boolean): void {
    if (loading) {
      this.progress4 = this.progress6 = 0;
    }
  }

  @Provide()
  snackbar(message: string, color?: string): void {
    this.snackbarData = {
      show: true,
      message,
      color,
    };
  }

  onLoad(results: Measurements): void {
    this.doSearch = false;

    if (
      results &&
      results.ipv4 &&
      results.ipv6 &&
      !results.ipv4.length &&
      !results.ipv6.length
    ) {
      this.snackbar(`Nenhuma entrada encontrada.`);
    } else {
      for (const version in results) {
        const result = results[version];
        const vName = `IPv${version.substring(3)}`;

        if (!results[version]) {
          this.snackbar(
            `Algo deu errado ao carregar os resultados em ${vName}`
          );
        } else if (!result.length) {
          this.snackbar(`Nenhuma entrada encontrada em ${vName}`);
        }
      }
    }

    this.results = results;
  }

  onUnload(version: number): void {
    this.results[`ipv${version}`] = null;
    this[`progress${version}`] = 0;
  }

  onProgress(version: number, loaded: number): void {
    this[`progress${version}`] = loaded;
  }

  formatBytes(bytes: number, decimals = 2): string {
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
