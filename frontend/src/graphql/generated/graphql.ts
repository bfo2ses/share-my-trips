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

export type AccountRole =
  | 'ADMIN'
  | 'FAMILY';

export type AddDayInput = {
  /** Date-only, format YYYY-MM-DD. */
  date: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
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
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
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
  /** Latitude for map placement. */
  lat: Scalars['Float']['output'];
  /** Longitude for map placement. */
  lng: Scalars['Float']['output'];
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
  /** Latitude for map placement. */
  lat: Scalars['Float']['output'];
  /** Longitude for map placement. */
  lng: Scalars['Float']['output'];
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

export type TripStatus =
  | 'CLOSED'
  | 'DRAFT'
  | 'PUBLISHED';

/** The date of a day is immutable after creation. To change the date, delete and recreate the day. */
export type UpdateDayInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
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
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
  startDate?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type UserError = {
  __typename?: 'UserError';
  field?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
};

export type RequestPasswordResetMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type RequestPasswordResetMutation = { __typename?: 'Mutation', requestPasswordReset: boolean };

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', token?: string | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type ResetPasswordMutationVariables = Exact<{
  input: ResetPasswordInput;
}>;


export type ResetPasswordMutation = { __typename?: 'Mutation', resetPassword: { __typename?: 'AccountPayload', account?: { __typename?: 'Account', id: string } | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type SetupAdminMutationVariables = Exact<{
  input: SetupAdminInput;
}>;


export type SetupAdminMutation = { __typename?: 'Mutation', setupAdmin: { __typename?: 'AuthPayload', token?: string | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'Account', id: string, name: string, email: string, role: AccountRole } | null };

export type SetupStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type SetupStatusQuery = { __typename?: 'Query', setupStatus: { __typename?: 'SetupStatusPayload', done: boolean } };

export type AddDayMutationVariables = Exact<{
  input: AddDayInput;
}>;


export type AddDayMutation = { __typename?: 'Mutation', addDay: { __typename?: 'DayPayload', day?: { __typename?: 'Day', id: string, tripID: string, stageIDs: Array<string>, date: string, title?: string | null, description?: string | null, lat: number, lng: number } | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type UpdateDayMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDayInput;
}>;


export type UpdateDayMutation = { __typename?: 'Mutation', updateDay: { __typename?: 'DayPayload', day?: { __typename?: 'Day', id: string, tripID: string, stageIDs: Array<string>, date: string, title?: string | null, description?: string | null, lat: number, lng: number } | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type DeleteDayMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteDayMutation = { __typename?: 'Mutation', deleteDay: { __typename?: 'DeleteDayPayload', success: boolean, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type DaysQueryVariables = Exact<{
  stageID: Scalars['ID']['input'];
}>;


export type DaysQuery = { __typename?: 'Query', days: Array<{ __typename?: 'Day', id: string, tripID: string, stageIDs: Array<string>, date: string, title?: string | null, description?: string | null, lat: number, lng: number }> };

export type AddStageMutationVariables = Exact<{
  input: AddStageInput;
}>;


export type AddStageMutation = { __typename?: 'Mutation', addStage: { __typename?: 'StagePayload', stage?: { __typename?: 'Stage', id: string, tripID: string, city: string, displayName: string, lat: number, lng: number, description: string } | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type UpdateStageMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateStageInput;
}>;


export type UpdateStageMutation = { __typename?: 'Mutation', updateStage: { __typename?: 'StagePayload', stage?: { __typename?: 'Stage', id: string, tripID: string, city: string, displayName: string, lat: number, lng: number, description: string } | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type DeleteStageMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteStageMutation = { __typename?: 'Mutation', deleteStage: { __typename?: 'DeleteStagePayload', success: boolean, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type StagesQueryVariables = Exact<{
  tripID: Scalars['ID']['input'];
}>;


export type StagesQuery = { __typename?: 'Query', stages: Array<{ __typename?: 'Stage', id: string, tripID: string, city: string, displayName: string, lat: number, lng: number, description: string }> };

export type TripQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TripQuery = { __typename?: 'Query', trip?: { __typename?: 'Trip', id: string, title: string, country: string, description: string, lat: number, lng: number, startDate?: string | null, endDate?: string | null, status: TripStatus, coverPhoto: string } | null };

export type CreateTripMutationVariables = Exact<{
  input: CreateTripInput;
}>;


export type CreateTripMutation = { __typename?: 'Mutation', createTrip: { __typename?: 'TripPayload', trip?: { __typename?: 'Trip', id: string, title: string, country: string, description: string, lat: number, lng: number, startDate?: string | null, endDate?: string | null, status: TripStatus, coverPhoto: string } | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type UpdateTripMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateTripInput;
}>;


export type UpdateTripMutation = { __typename?: 'Mutation', updateTrip: { __typename?: 'TripPayload', trip?: { __typename?: 'Trip', id: string, title: string, country: string, description: string, lat: number, lng: number, startDate?: string | null, endDate?: string | null, status: TripStatus, coverPhoto: string } | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type DeleteTripMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTripMutation = { __typename?: 'Mutation', deleteTrip: { __typename?: 'DeleteTripPayload', success: boolean, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type PublishTripMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type PublishTripMutation = { __typename?: 'Mutation', publishTrip: { __typename?: 'TripPayload', trip?: { __typename?: 'Trip', id: string, status: TripStatus } | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type UnpublishTripMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UnpublishTripMutation = { __typename?: 'Mutation', unpublishTrip: { __typename?: 'TripPayload', trip?: { __typename?: 'Trip', id: string, status: TripStatus } | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type CloseTripMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: CloseTripInput;
}>;


export type CloseTripMutation = { __typename?: 'Mutation', closeTrip: { __typename?: 'TripPayload', trip?: { __typename?: 'Trip', id: string, status: TripStatus, startDate?: string | null, endDate?: string | null } | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type ReopenTripMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ReopenTripMutation = { __typename?: 'Mutation', reopenTrip: { __typename?: 'TripPayload', trip?: { __typename?: 'Trip', id: string, status: TripStatus } | null, errors: Array<{ __typename?: 'UserError', field?: string | null, message: string }> } };

export type TripsQueryVariables = Exact<{
  status?: InputMaybe<Array<TripStatus> | TripStatus>;
}>;


export type TripsQuery = { __typename?: 'Query', trips: Array<{ __typename?: 'Trip', id: string, title: string, country: string, lat: number, lng: number, startDate?: string | null, endDate?: string | null, status: TripStatus, coverPhoto: string }> };


export const RequestPasswordResetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestPasswordReset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestPasswordReset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]} as unknown as DocumentNode<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const ResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ResetPasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<ResetPasswordMutation, ResetPasswordMutationVariables>;
export const SetupAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetupAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetupAdminInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setupAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<SetupAdminMutation, SetupAdminMutationVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const SetupStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SetupStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setupStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"done"}}]}}]}}]} as unknown as DocumentNode<SetupStatusQuery, SetupStatusQueryVariables>;
export const AddDayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddDay"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddDayInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addDay"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"day"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripID"}},{"kind":"Field","name":{"kind":"Name","value":"stageIDs"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"lng"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<AddDayMutation, AddDayMutationVariables>;
export const UpdateDayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDay"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDayInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDay"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"day"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripID"}},{"kind":"Field","name":{"kind":"Name","value":"stageIDs"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"lng"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateDayMutation, UpdateDayMutationVariables>;
export const DeleteDayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteDay"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteDay"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteDayMutation, DeleteDayMutationVariables>;
export const DaysDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Days"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stageID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"days"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"stageID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"stageID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripID"}},{"kind":"Field","name":{"kind":"Name","value":"stageIDs"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"lng"}}]}}]}}]} as unknown as DocumentNode<DaysQuery, DaysQueryVariables>;
export const AddStageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddStage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddStageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addStage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripID"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"lng"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<AddStageMutation, AddStageMutationVariables>;
export const UpdateStageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateStageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripID"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"lng"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateStageMutation, UpdateStageMutationVariables>;
export const DeleteStageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteStage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteStage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteStageMutation, DeleteStageMutationVariables>;
export const StagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Stages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tripID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripID"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"lng"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<StagesQuery, StagesQueryVariables>;
export const TripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Trip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"lng"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"coverPhoto"}}]}}]}}]} as unknown as DocumentNode<TripQuery, TripQueryVariables>;
export const CreateTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTripInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trip"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"lng"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"coverPhoto"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<CreateTripMutation, CreateTripMutationVariables>;
export const UpdateTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTripInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trip"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"lng"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"coverPhoto"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateTripMutation, UpdateTripMutationVariables>;
export const DeleteTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteTripMutation, DeleteTripMutationVariables>;
export const PublishTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PublishTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trip"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<PublishTripMutation, PublishTripMutationVariables>;
export const UnpublishTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnpublishTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unpublishTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trip"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<UnpublishTripMutation, UnpublishTripMutationVariables>;
export const CloseTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CloseTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CloseTripInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"closeTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trip"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<CloseTripMutation, CloseTripMutationVariables>;
export const ReopenTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReopenTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reopenTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trip"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<ReopenTripMutation, ReopenTripMutationVariables>;
export const TripsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Trips"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TripStatus"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trips"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"lng"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"coverPhoto"}}]}}]}}]} as unknown as DocumentNode<TripsQuery, TripsQueryVariables>;