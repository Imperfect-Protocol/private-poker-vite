import { mesh as devMesh } from './dev.js';
import { mesh as mainMesh } from './main.js';

const meshes = {
  dev: devMesh,
  main: mainMesh,
};

const selectedMesh = process.env.NEXT_PUBLIC_PRIVATE_POKER_MESH ?? 'main';
const selectedMeshKey = selectedMesh.toLowerCase();

export const MESH = meshes[selectedMeshKey] ?? mainMesh;
export const MESH_KEY = MESH.key;
export const MESH_ENDPOINTS = MESH.endpoints;
