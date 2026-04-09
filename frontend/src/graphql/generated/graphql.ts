/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Account = {
  __typename?: 'Account';
  /** RFC 3339 timestamp. */
  createdAt: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  role: AccountRole;
};

export type AccountPayload = {
  __typename?: 'AccountPayload';
  account?: Maybe<Account>;
  errors: Array<UserError>;
};

export enum AccountRole {
  Admin = 'ADMIN',
  Family = 'FAMILY'
}

export type AddDayInput = {
  /** Date-only, format YYYY-MM-DD. */
  date: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  stageID: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  tripID: Scalars['ID']['input'];
};

export type AddStageInput = {
  city: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  tripID: Scalars['ID']['input'];
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  account?: Maybe<Account>;
  errors: Array<UserError>;
  /** Session token. Present on success, null on error. */
  token?: Maybe<Scalars['String']['output']>;
};

export type ChangePasswordInput = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
  newPasswordConfirm: Scalars['String']['input'];
};

export type CloseTripInput = {
  firstDay: Scalars['String']['input'];
  lastDay: Scalars['String']['input'];
};

export type CreateAccountInput = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  passwordConfirm: Scalars['String']['input'];
};

export type CreateTripInput = {
  country: Scalars['String']['input'];
  coverPhoto?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type Day = {
  __typename?: 'Day';
  /** RFC 3339 timestamp. */
  createdAt: Scalars['String']['output'];
  /** Date-only, format YYYY-MM-DD. */
  date: Scalars['String']['output'];
  /** Null when not provided. */
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  stageIDs: Array<Scalars['ID']['output']>;
  /** Null when not provided. */
  title?: Maybe<Scalars['String']['output']>;
  tripID: Scalars['ID']['output'];
  /** RFC 3339 timestamp. */
  updatedAt: Scalars['String']['output'];
};

export type DayPayload = {
  __typename?: 'DayPayload';
  day?: Maybe<Day>;
  errors: Array<UserError>;
};

export type DeleteAccountPayload = {
  __typename?: 'DeleteAccountPayload';
  errors: Array<UserError>;
  success: Scalars['Boolean']['output'];
};

export type DeleteDayPayload = {
  __typename?: 'DeleteDayPayload';
  errors: Array<UserError>;
  success: Scalars['Boolean']['output'];
};

export type DeleteStagePayload = {
  __typename?: 'DeleteStagePayload';
  errors: Array<UserError>;
  success: Scalars['Boolean']['output'];
};

export type DeleteTripPayload = {
  __typename?: 'DeleteTripPayload';
  errors: Array<UserError>;
  success: Scalars['Boolean']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addDay: DayPayload;
  addStage: StagePayload;
  attachDayToStage: DayPayload;
  changePassword: AccountPayload;
  closeTrip: TripPayload;
  /** Creates a family account. Requires admin role. */
  createAccount: AccountPayload;
  createTrip: TripPayload;
  /** Deletes an account. Requires admin role. Cannot delete own account. */
  deleteAccount: DeleteAccountPayload;
  deleteDay: DeleteDayPayload;
  deleteStage: DeleteStagePayload;
  deleteTrip: DeleteTripPayload;
  detachDayFromStage: DayPayload;
  login: AuthPayload;
  logout: Scalars['Boolean']['output'];
  publishTrip: TripPayload;
  reopenTrip: TripPayload;
  /** Sends a password reset email. Always returns true regardless of whether the email exists. */
  requestPasswordReset: Scalars['Boolean']['output'];
  resetPassword: AccountPayload;
  /** Creates the first admin account. Returns ErrSetupAlreadyDone if an admin already exists. */
  setupAdmin: AuthPayload;
  unpublishTrip: TripPayload;
  updateDay: DayPayload;
  updateStage: StagePayload;
  updateTrip: TripPayload;
};


export type MutationAddDayArgs = {
  input: AddDayInput;
};


export type MutationAddStageArgs = {
  input: AddStageInput;
};


export type MutationAttachDayToStageArgs = {
  dayID: Scalars['ID']['input'];
  stageID: Scalars['ID']['input'];
};


export type MutationChangePasswordArgs = {
  input: ChangePasswordInput;
};


export type MutationCloseTripArgs = {
  id: Scalars['ID']['input'];
  input: CloseTripInput;
};


export type MutationCreateAccountArgs = {
  input: CreateAccountInput;
};


export type MutationCreateTripArgs = {
  input: CreateTripInput;
};


export type MutationDeleteAccountArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDayArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteStageArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTripArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDetachDayFromStageArgs = {
  dayID: Scalars['ID']['input'];
  stageID: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationPublishTripArgs = {
  id: Scalars['ID']['input'];
};


export type MutationReopenTripArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRequestPasswordResetArgs = {
  email: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  input: ResetPasswordInput;
};


export type MutationSetupAdminArgs = {
  input: SetupAdminInput;
};


export type MutationUnpublishTripArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateDayArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDayInput;
};


export type MutationUpdateStageArgs = {
  id: Scalars['ID']['input'];
  input: UpdateStageInput;
};


export type MutationUpdateTripArgs = {
  id: Scalars['ID']['input'];
  input: UpdateTripInput;
};

export type Query = {
  __typename?: 'Query';
  /** Returns all accounts. Requires admin role. */
  accounts: Array<Account>;
  /** Returns a single day by ID, or null if not found. */
  day?: Maybe<Day>;
  /** Returns all days for a stage, sorted by date ascending. */
  days: Array<Day>;
  /** Returns the currently authenticated account, or null if not authenticated. */
  me?: Maybe<Account>;
  /** Returns true if the admin account has already been created. */
  setupStatus: SetupStatusPayload;
  /** Returns a single stage by ID, or null if not found. */
  stage?: Maybe<Stage>;
  /** Returns all stages for a trip, sorted by the date of their first day ascending. Stages without any day appear last in undefined order. */
  stages: Array<Stage>;
  /** Returns a single trip by ID, or null if not found. */
  trip?: Maybe<Trip>;
  /** Returns all trips sorted by startDate descending. Trips without a startDate appear last in undefined order. */
  trips: Array<Trip>;
};


export type QueryDayArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDaysArgs = {
  stageID: Scalars['ID']['input'];
};


export type QueryStageArgs = {
  id: Scalars['ID']['input'];
};


export type QueryStagesArgs = {
  tripID: Scalars['ID']['input'];
};


export type QueryTripArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTripsArgs = {
  status?: InputMaybe<Array<TripStatus>>;
};

export type ResetPasswordInput = {
  newPassword: Scalars['String']['input'];
  newPasswordConfirm: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type SetupAdminInput = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  passwordConfirm: Scalars['String']['input'];
};

export type SetupStatusPayload = {
  __typename?: 'SetupStatusPayload';
  done: Scalars['Boolean']['output'];
};

export type Stage = {
  __typename?: 'Stage';
  city: Scalars['String']['output'];
  /** RFC 3339 timestamp. */
  createdAt: Scalars['String']['output'];
  description: Scalars['String']['output'];
  /** Display name: returns name if set, otherwise city. */
  displayName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lat: Scalars['Float']['output'];
  lng: Scalars['Float']['output'];
  /** Custom name, if set. Null when not provided. */
  name?: Maybe<Scalars['String']['output']>;
  tripID: Scalars['ID']['output'];
  /** RFC 3339 timestamp. */
  updatedAt: Scalars['String']['output'];
};

export type StagePayload = {
  __typename?: 'StagePayload';
  errors: Array<UserError>;
  stage?: Maybe<Stage>;
};

export type Trip = {
  __typename?: 'Trip';
  country: Scalars['String']['output'];
  coverPhoto: Scalars['String']['output'];
  /** RFC 3339 timestamp (e.g. 2025-07-01T10:00:00Z). */
  createdAt: Scalars['String']['output'];
  description: Scalars['String']['output'];
  /** Date-only, format YYYY-MM-DD. Null when not set. */
  endDate?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** Date-only, format YYYY-MM-DD. Null when not set. */
  startDate?: Maybe<Scalars['String']['output']>;
  status: TripStatus;
  title: Scalars['String']['output'];
  /** RFC 3339 timestamp (e.g. 2025-07-01T10:00:00Z). */
  updatedAt: Scalars['String']['output'];
};

export type TripPayload = {
  __typename?: 'TripPayload';
  errors: Array<UserError>;
  trip?: Maybe<Trip>;
};

export enum TripStatus {
  Closed = 'CLOSED',
  Draft = 'DRAFT',
  Published = 'PUBLISHED'
}

/** The date of a day is immutable after creation. To change the date, delete and recreate the day. */
export type UpdateDayInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateStageInput = {
  city: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTripInput = {
  country: Scalars['String']['input'];
  coverPhoto?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type UserError = {
  __typename?: 'UserError';
  field?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
};

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', token?: string | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };


export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;