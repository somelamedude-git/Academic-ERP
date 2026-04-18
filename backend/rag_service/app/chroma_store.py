import re
from typing import List

import chromadb
from chromadb.errors import NotFoundError
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import StorageContext, VectorStoreIndex


def _safe_collection_name(course_id: str, material_id: str) -> str:
    raw = f"course_{course_id}_material_{material_id}".lower()
    cleaned = re.sub(r"[^a-z0-9_]", "_", raw)
    return cleaned[:120]


class ChromaStore:
    def __init__(self, persist_dir: str):
        self.client = chromadb.PersistentClient(path=persist_dir)

    def _delete_if_exists(self, name: str) -> None:
        try:
            self.client.delete_collection(name=name)
        except (NotFoundError, ValueError):
            pass

    def collection_name(self, course_id: str, material_id: str) -> str:
        return _safe_collection_name(course_id, material_id)

    def get_or_create_vector_store(self, course_id: str, material_id: str) -> ChromaVectorStore:
        name = self.collection_name(course_id, material_id)
        collection = self.client.get_or_create_collection(name=name)
        return ChromaVectorStore(chroma_collection=collection)

    def get_existing_vector_store(self, course_id: str, material_id: str) -> ChromaVectorStore:
        name = self.collection_name(course_id, material_id)
        collection = self.client.get_collection(name=name)
        return ChromaVectorStore(chroma_collection=collection)

    def upsert_index_from_documents(
        self,
        course_id: str,
        material_id: str,
        documents: List,
        embed_model,
        replace_existing: bool = True,
    ) -> VectorStoreIndex:
        name = self.collection_name(course_id, material_id)
        if replace_existing:
            self._delete_if_exists(name)
        vector_store = self.get_or_create_vector_store(course_id, material_id)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        return VectorStoreIndex.from_documents(
            documents,
            storage_context=storage_context,
            embed_model=embed_model,
        )

    def load_index(self, course_id: str, material_id: str, embed_model):
        vector_store = self.get_existing_vector_store(course_id, material_id)
        return VectorStoreIndex.from_vector_store(vector_store=vector_store, embed_model=embed_model)
