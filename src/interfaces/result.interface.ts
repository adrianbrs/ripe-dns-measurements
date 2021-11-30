export interface MeasurementAnswer {
  TYPE: string;
  NAME: string;
  RDATA: string[];
}

export interface MeasurementResult {
  rt: number;
  size: number;
  abuf: string;
  ID: number;
  ANCOUNT: number;
  QDCOUNT: number;
  NSCOUNT: number;
  ARCOUNT: number;
  answers: MeasurementAnswer[];
}

export interface MeasurementEntry {
  fw: number;
  mver: string;
  lts: number;
  dst_addr: string;
  dst_port: string;
  af: number;
  src_addr: string;
  proto: string;
  result: MeasurementResult;
  msm_id: number;
  prb_id: number;
  timestamp: number;
  msm_name: string;
  from: string;
  type: string;
  stored_timestamp: number;
}

export interface Measurements {
  ipv4: MeasurementEntry[];
  ipv6: MeasurementEntry[];
}
