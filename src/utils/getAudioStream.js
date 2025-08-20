  import fs from "fs";
  export async function getAudioStream(audioFileRoute) {
    try {
      return fs.createReadStream(audioFileRoute);
    } catch (error) {
      // console.error("Error al obtener el audio:", error);
      throw error;
    }
  }