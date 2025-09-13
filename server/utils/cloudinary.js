import fs from 'fs';
import cd from 'cloudinary';
import { orderBy } from 'lodash';

const app = 'prepai'

cd.config({
  cloud_name: 'daqc8bim3',
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

const cdList = () =>
  cd.v2.api
    .resources({ max_results: 500 })
    .then(r => orderBy(r.resources, 'public_id'));

const cdVersion = () =>
  cd.v2.api
    .resources({ max_results: 500 })
    .then(r => orderBy(r.resources, 'version', 'desc')[0].version);

const cdupload = (url, folder, type = 'image') =>
  cd.v2.uploader.upload(url, {
    asset_folder: `${app}/${folder}`,
    use_asset_folder_as_public_id_prefix: true,
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    resource_type: type
  });

const cdUploadFolder = async (local, remote) => {
  try {
    const fns = fs.readdirSync(local);
    for (let f of fns) {
      console.log(`${local}/${f}`);
      await cdupload(`${local}/${f}`, `${app}/${remote}`);
      console.log(remote);
      console.log(f);
    }
    return 'done';
  } catch (e) {
    return e.message;
  }
};

const cdDelete = id =>
  cd.v2.api.delete_resources([`${app}/${id}`]);

export {
  cdList,
  cdVersion,
  cdupload,
  cdUploadFolder,
  cdDelete
};
