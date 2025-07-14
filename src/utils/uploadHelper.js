import clientStore from "../stores/clientStore";
import { uploadToTOS } from "./tosHelper";

export const uploadImage = (file, key) => uploadToTOS(file, `clients/${clientStore.client.id}/${key}`);
