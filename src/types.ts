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

export type BulkRowState = {
  uid: string;
  id: string;
  address: string;
  phone: string;
  workingTime: string;
  rubric: string;
  lon: string;
  lat: string;
  nameOther: string;
  locality: string;
};

export type NetworkState = {
  name: string;
  shortname: string;
  country: string;
  rubric: string;
  actualization: string;
  phoneType: string;
};

export type Rubric = {
  id: string;
  name: string;
};

export type StoredState = {
  tab?: string;
  network?: NetworkState;
  stations?: StationState[];
  bulkRows?: BulkRowState[];
};
