<template>
  <div class="d-flex">
    <v-file-input
      v-model="file"
      label="Medição (JSON)"
      placeholder="Faça upload do resultado da medição em JSON"
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

    <v-tooltip right>
      Clique para enviar

      <template #activator="{ on }">
        <v-btn
          text
          icon
          class="ml-2"
          v-on="on"
          @click="upload()"
          :loading="uploading"
          :disabled="!file || uploading || uploaded"
        >
          <v-icon>mdi-upload</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { MeasurementEntry } from "@/interfaces/result.interface";

@Component
export default class AppUploader extends Vue {
  @Prop(Boolean)
  value!: boolean;

  file: Blob | null = null;
  reader!: FileReader;
  error: string | null = null;
  uploaded = false;

  get uploading(): boolean {
    return !!this.value;
  }
  set uploading(uploading: boolean) {
    this.$emit("input", uploading);
  }

  @Watch("file")
  watchFile(file: Blob): void {
    if (!file) {
      this.$emit("unload");
    }
    this.uploaded = false;
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
    // this.reader.addEventListener("progress", (e) => this.onProgress(e));
  }

  upload(): void {
    if (this.file) {
      this.reader.readAsText(this.file);
    }
  }

  success(result: MeasurementEntry[]): void {
    this.$emit("load", result);
    this.uploaded = true;
  }

  // onProgress(e: ProgressEvent<FileReader>) {

  // }

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
