/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n": typeof types.RequestPasswordResetDocument,
    "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input) {\n      account {\n        id\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.ResetPasswordDocument,
    "\n  mutation SetupAdmin($input: SetupAdminInput!) {\n    setupAdmin(input: $input) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.SetupAdminDocument,
    "\n  mutation Logout {\n    logout\n  }\n": typeof types.LogoutDocument,
    "\n  query SetupStatus {\n    setupStatus {\n      done\n    }\n  }\n": typeof types.SetupStatusDocument,
    "\n  query Days($stageID: ID!) {\n    days(stageID: $stageID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n    }\n  }\n": typeof types.DaysDocument,
    "\n  query Stages($tripID: ID!) {\n    stages(tripID: $tripID) {\n      id\n      tripID\n      city\n      displayName\n      lat\n      lng\n      description\n    }\n  }\n": typeof types.StagesDocument,
    "\n  query Trip($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n": typeof types.TripDocument,
    "\n  query Trips($status: [TripStatus!]) {\n    trips(status: $status) {\n      id\n      title\n      country\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n": typeof types.TripsDocument,
};
const documents: Documents = {
    "\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n": types.RequestPasswordResetDocument,
    "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input) {\n      account {\n        id\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.ResetPasswordDocument,
    "\n  mutation SetupAdmin($input: SetupAdminInput!) {\n    setupAdmin(input: $input) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.SetupAdminDocument,
    "\n  mutation Logout {\n    logout\n  }\n": types.LogoutDocument,
    "\n  query SetupStatus {\n    setupStatus {\n      done\n    }\n  }\n": types.SetupStatusDocument,
    "\n  query Days($stageID: ID!) {\n    days(stageID: $stageID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n    }\n  }\n": types.DaysDocument,
    "\n  query Stages($tripID: ID!) {\n    stages(tripID: $tripID) {\n      id\n      tripID\n      city\n      displayName\n      lat\n      lng\n      description\n    }\n  }\n": types.StagesDocument,
    "\n  query Trip($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n": types.TripDocument,
    "\n  query Trips($status: [TripStatus!]) {\n    trips(status: $status) {\n      id\n      title\n      country\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n": types.TripsDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n"): (typeof documents)["\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input) {\n      account {\n        id\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input) {\n      account {\n        id\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SetupAdmin($input: SetupAdminInput!) {\n    setupAdmin(input: $input) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation SetupAdmin($input: SetupAdminInput!) {\n    setupAdmin(input: $input) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation Logout {\n    logout\n  }\n"): (typeof documents)["\n  mutation Logout {\n    logout\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query SetupStatus {\n    setupStatus {\n      done\n    }\n  }\n"): (typeof documents)["\n  query SetupStatus {\n    setupStatus {\n      done\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Days($stageID: ID!) {\n    days(stageID: $stageID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n    }\n  }\n"): (typeof documents)["\n  query Days($stageID: ID!) {\n    days(stageID: $stageID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Stages($tripID: ID!) {\n    stages(tripID: $tripID) {\n      id\n      tripID\n      city\n      displayName\n      lat\n      lng\n      description\n    }\n  }\n"): (typeof documents)["\n  query Stages($tripID: ID!) {\n    stages(tripID: $tripID) {\n      id\n      tripID\n      city\n      displayName\n      lat\n      lng\n      description\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Trip($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n"): (typeof documents)["\n  query Trip($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Trips($status: [TripStatus!]) {\n    trips(status: $status) {\n      id\n      title\n      country\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n"): (typeof documents)["\n  query Trips($status: [TripStatus!]) {\n    trips(status: $status) {\n      id\n      title\n      country\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;