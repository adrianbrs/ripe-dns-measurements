<template>
  <div class="d-flex">
    <v-file-input
      v-model="file"
      :label="`Medição ${fullIPVersion} (JSON)`"
      :placeholder="`Resultado da medição ${fullIPVersion} em JSON`"
      prepend-icon="mdi-code-json"
      accept="application/json"
      :error="this.error"
      :messages="this.error"
      :disabled="uploading"
      :success="uploaded"
      hide-details="auto"
      dense
      outlined
      @change="onChange"
    >
    </v-file-input>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { MeasurementEntry } from "@/interfaces/result.interface";

@Component
export default class AppUploaderInput extends Vue {
  @Prop(Blob)
  value!: Blob | null;

  @Prop(Boolean)
  loading!: boolean;

  @Prop({
    type: Number,
    default: 4,
  })
  ipVersion!: 4 | 6;

  @Prop(Boolean)
  startUpload!: boolean;

  reader!: FileReader;
  error: string | null = null;
  uploaded = false;

  get uploading(): boolean {
    return !!this.loading;
  }
  set uploading(uploading: boolean) {
    this.$emit("update:loading", uploading);
  }

  get file(): Blob {
    return this.value;
  }
  set file(file: Blob) {
    this.$emit("input", file);
  }

  get fullIPVersion(): string {
    return `IPv${this.ipVersion}`;
  }

  @Watch("file")
  watchFile(file: Blob): void {
    if (!file) {
      this.$emit("unload", this.ipVersion);
    }
    this.uploaded = false;
  }

  @Watch("startUpload", {
    immediate: true,
  })
  watchStartUpload(start: boolean): void {
    if (start) {
      this.upload();
    }
  }

  created(): void {
    this.reader = new FileReader();
    this.reader.addEventListener("load", (e) => this.onLoad(e));
    this.reader.addEventListener("loadstart", () => {
      this.uploading = true;
    });
    this.reader.addEventListener("loadend", () => {
      this.uploading = false;
    });
    this.reader.addEventListener("abort", () => {
      this.uploading = false;
    });
    this.reader.addEventListener("progress", (e) => {
      this.$emit("progress", this.ipVersion, e.loaded);
    });
  }

  upload(): void {
    if (this.value) {
      this.reader.readAsText(this.value);
    }
  }

  success(result: MeasurementEntry[]): void {
    this.$emit("load", this.ipVersion, result);
    this.$emit("update:startUpload", false);
    this.uploaded = true;
  }

  onChange(input: Blob | null): void {
    if (!input) {
      this.error = null;
      this.uploaded = false;
    }
  }

  onLoad(e: ProgressEvent<FileReader>): void {
    const result = e.target?.result as string;

    if (!result) {
      this.error = "Algo deu errado no envio do arquivo, tente novamente.";
      return;
    }

    try {
      const json = JSON.parse(result);
      this.success(json);
    } catch (err) {
      console.error(err);
      this.error = "O arquivo enviado não é um JSON válido.";
    }
  }
}
</script>
