export type Phone = {
  number: string;
  type: string;
  ext: string;
  info: string;
};

export type Photo = {
  url: string;
  alt: string;
  type: string;
  tag: string;
};

export type StationState = {
  uid: string;
  id: string;
  nameOther: string;
  address: string;
  locality: string;
  addressAdd: string;
  workingTime: string;
  scheduled: string;
  rubrics: string[];
  phones: Phone[];
  email: string;
  url: string;
  addUrl: string;
  infoPage: string;
  lon: string;
  lat: string;
  galleryUrl: string;
  photos: Photo[];
  fuels: string[];
  services: string[];
  name?: string;
  shortname?: string;
};
