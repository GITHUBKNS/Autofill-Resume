export type CandidateProfile = {
  profileId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
};

export type FillResult = {
  detected: number;
  filled: number;
  warnings: string[];
};
