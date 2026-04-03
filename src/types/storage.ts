import type { NetworkState } from "./network";
import type { StationState } from "./station";
import type { BulkRowState } from "./bulk";

export type StoredState = {
  tab?: string;
  network?: NetworkState;
  stations?: StationState[];
  bulkRows?: BulkRowState[];
};
