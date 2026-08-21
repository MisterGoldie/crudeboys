const manifest = {
  "manifest": "arweave/paths",
  "version": "0.1.0",
  "index": {
    "path": "index.html"
  },
  "paths": {
    "index.html": {
      "id": "oc24ulDYknaP32SDVnwB1jdUPGqhxUZWpuZHXnjaDlg"
    },
    "main.css": {
      "id": "bGdaqZf6EQnZLGKtiFj4iKCb1tO4xapLDteAxel4Lw4"
    },
    "js/crudeboys_image.json": {
      "id": "hOi37GKaCGipB-8mD-psqDCkIAUGv1BC9AH_xgt8hP4"
    },
    "images/four.png": {
      "id": "2IGi81Uke6P65ZkG76oGRbQ0AkPLsmLVxyojCytvyTY"
    },
    "images/five.png": {
      "id": "2EBjRnJCWup4hdd0Xjbh44NUF5aBsvChV-kg2F1beEw"
    },
    "images/six.png": {
      "id": "8zjlTaUIqeACbBrh6FrY-Q2xIXsw5b5rDahvxqH36Ys"
    },
    "images/seven.png": {
      "id": "znxrxVhRFK1vfAvMwTZxWp4-BL8zBD8SQd_GgtkvEfc"
    },
    "images/eight.png": {
      "id": "-ebk0BQ_T8vKsAhj6nnamH4A7f9iX_cC76g_vS-xYiw"
    },
    "images/nine.png": {
      "id": "E7X3tRPinAmWIZLLoLdxyHTzJY0X2Wi4D3PuVQnT4AM"
    },
    "images/ten.png": {
      "id": "GMOiQptD0gTzhHkchcDvL8JO6oQBpmiSLdNLL1ujiTc"
    },
    "images/eleven.png": {
      "id": "dRV_HK5fR-jmXEqXvSj6UB2z-eSI7xUvJbQWNjP_DaY"
    },
    "images/twelve.png": {
      "id": "eofIhaehyRucDrWDQpVpoLFYEnQSWBnV6zJ_rwDMTHA"
    },
    "images/thirteen.png": {
      "id": "5uAtB9giMOEM2m2UfxIdmKPYSy01hD-Z0UI_quY45z8"
    },
    "images/fourteen.png": {
      "id": "0AtGGPZKgaVaPga65VltAlUY-40q6We_EpLx9QUzBhg"
    },
    "images/fifteen.png": {
      "id": "-Sp_8fLvO7WewgOGQk2k-1Nupr0nB3MLnJnucTHXqfA"
    },
    "images/sixteen.png": {
      "id": "LhDdy2vDuZG2_Ae0ejWnzcVk64qQOeu5pu97iAgB6GU"
    },
    "images/seventeen.png": {
      "id": "MxGIRaYWgyr2xJnJiwGh4s9It1Ejid4GWvyyhmGbw30"
    },
    "images/eighteen.png": {
      "id": "uU3ZDL5UiAcrbkFxMFhu6FoakmT6YwKjwGbEgJKP7BM"
    },
    "images/nineteen.png": {
      "id": "RhVg5LCykU-fK2Lq8ErnRq0o1k8eCaF9nYlLvQZFYiI"
    },
    "images/twenty4.png": {
      "id": "whK0Nhy72O-CCNRXgmUlwge1SYMHyhrV_6FAO6uvkaU"
    },
    "images/twenty5.png": {
      "id": "V0XXw42td3rmbJ4i8ijMfK0Ho_-meeqC_HCJsTxUIuk"
    }
  }
};

// On-disk files the live site needs that are not in `paths` yet.
// Paste new tx ids into `paths` after upload. Do not invent ids.
export const pending = [
  "js/script.js",
  "js/wallet.js",
  "js/imagesloaded.pkgd.min.js",
  "js/TweenMax.min.js",
  "js/crudeboys_traits.json",
  "js/cruno.json",
  "js/cups.json",
  "images/codlogo.png",
  "images/cardpromo.webp",
  "images/raretraits.webp",
  "images/29bd4140-0dc3-4e5a-95fb-0a75e785d1a4.avif",
  "images/inubits.png",
  "images/logo.avif",
  "images/o.png",
  "images/1.png"
];

// These `paths` ids still resolve, but the Arweave bytes are older than disk.
export const stale = [
  "index.html",
  "main.css"
];

export default manifest;
