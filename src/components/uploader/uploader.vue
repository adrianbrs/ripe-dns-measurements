<template>
  <div>
    <app-uploader-input
      v-model="filev4"
      :loading.sync="loading"
      :start-upload.sync="startUpload"
      :ip-version="4"
      class="mb-2"
      @progress="onProgress"
      @load="onLoad"
    ></app-uploader-input>

    <app-uploader-input
      v-model="filev6"
      :loading.sync="loading"
      :start-upload.sync="startUpload"
      :ip-version="6"
      @progress="onProgress"
      @load="onLoad"
    ></app-uploader-input>

    <div class="text-right d-block">
      <v-tooltip right>
        Clique para enviar

        <template #activator="{ on }">
          <v-btn
            v-on="on"
            class="mt-2"
            @click="upload()"
            :loading="loading"
            :disabled="!filev4 || !filev6 || loading || uploaded"
          >
            Enviar
            <v-icon right>mdi-upload</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { MeasurementEntry, Measurements } from "@/interfaces/result.interface";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import AppUploaderInput from "./uploader-input.vue";

@Component({
  components: { AppUploaderInput },
})
export default class AppUploader extends Vue {
  @Prop()
  value!: boolean;

  startUpload = false;
  uploaded4 = false;
  uploaded6 = false;
  result4: MeasurementEntry[] | null = null;
  result6: MeasurementEntry[] | null = null;
  filev4: Blob | null = null;
  filev6: Blob | null = null;

  get loading(): boolean {
    return !!this.value;
  }
  set loading(loading: boolean) {
    this.$emit("input", loading);
  }

  get uploaded(): boolean {
    return this.uploaded4 && this.uploaded6;
  }

  @Watch("filev4")
  watchFile4(): void {
    this.uploaded4 = false;
  }

  @Watch("filev6")
  watchFile6(): void {
    this.uploaded6 = false;
  }

  onProgress(version: number, loaded: number): void {
    this.$emit("progress", version, loaded);
  }

  onLoad(version: number, result: MeasurementEntry[]): void {
    this.$emit(`load:ipv${version}`, result);
    this[`result${version}`] = result;
    this[`uploaded${version}`] = true;

    this.$nextTick(() => {
      if (this.uploaded) {
        const results: Measurements = {
          ipv4: this.result4,
          ipv6: this.result6,
        };
        this.$emit("load", results);

        this.loading = false;
      }
    });
  }

  upload(): void {
    if (!this.startUpload) {
      this.$emit("load", null);
      this.startUpload = true;
    }
  }
}
</script>
