import {
  createDeleteStoryHandler,
  createGetStoryHandler,
  createPatchStoryHandler,
} from "./_handler";

export const GET = createGetStoryHandler();
export const PATCH = createPatchStoryHandler();
export const DELETE = createDeleteStoryHandler();
