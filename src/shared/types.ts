export interface Channel {
  name: string;
  rxFrequency: number;
  txFrequency: number;
  scan: boolean;
  active: boolean;
  offset: number;
}

export interface NetworkChannelRef {
  channelName: string;
  mode: string;
}

export interface Network {
  name: string;
  channels: NetworkChannelRef[];
}

export interface ALeNet {
  name: string;
  data: string;
}

export interface CodeplugData {
  general: Record<string, string>;
  controls: Record<string, string>;
  channels: Channel[];
  networks: Network[];
  aleNets: ALeNet[];
  nccMembers: string[];
  reportingUrls: Record<string, string>;
}
