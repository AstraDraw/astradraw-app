import { useCallback, useRef, useEffect, useState } from "react";
import { t } from "@excalidraw/excalidraw/i18n";

import { useAtom, useAtomValue, useSetAtom } from "../app-jotai";
import {
  activeCollectionIdAtom,
  triggerCollectionsRefreshAtom,
  collectionsAtom,
  privateCollectionAtom,
  activeCollectionAtom,
  type CollectionData,
} from "../components/Settings/settingsState";
import { showError } from "../utils/toast";
import {
  listCollections,
  createCollection as createCollectionApi,
  updateCollection as updateCollectionApi,
  deleteCollection as deleteCollectionApi,
  type Collection,
} from "../auth/workspaceApi";

interface CreateCollectionData {
  name: string;
  icon?: string;
}

interface UpdateCollectionData {
  name?: string;
  icon?: string;
}

interface UseCollectionsOptions {
  workspaceId: string | null;
}

interface UseCollectionsResult {
  collections: Collection[];
  isLoading: boolean;
  activeCollectionId: string | null;
  setActiveCollectionId: (id: string | null) => void;
  privateCollection: Collection | undefined;
  activeCollection: Collection | null;
  loadCollections: () => Promise<void>;
  createCollection: (data: CreateCollectionData) => Promise<Collection | null>;
  updateCollection: (
    id: string,
    data: UpdateCollectionData,
  ) => Promise<Collection | null>;
  deleteCollection: (id: string) => Promise<boolean>;
}

/**
 * Hook for collection CRUD operations.
 *
 * Uses Jotai atoms for shared state:
 * - collectionsAtom: List of collections for current workspace
 * - activeCollectionIdAtom: Currently selected collection ID
 * - privateCollectionAtom: Derived atom for private collection
 * - activeCollectionAtom: Derived atom for active collection object
 */
export function useCollections({
  workspaceId,
}: UseCollectionsOptions): UseCollectionsResult {
  // Use Jotai atoms for shared state
  const [collections, setCollections] = useAtom(collectionsAtom);
  const [activeCollectionId, setActiveCollectionId] = useAtom(
    activeCollectionIdAtom,
  );
  const privateCollection = useAtomValue(privateCollectionAtom);
  const activeCollection = useAtomValue(activeCollectionAtom);
  const triggerCollectionsRefresh = useSetAtom(triggerCollectionsRefreshAtom);

  // Local loading state
  const [isLoading, setIsLoading] = useState(false);

  // Track if we've set the default collection to prevent infinite loops
  const hasSetDefaultCollectionRef = useRef(false);

  // Load collections for current workspace
  const loadCollections = useCallback(async () => {
    if (!workspaceId) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await listCollections(workspaceId);
      setCollections(data as CollectionData[]);
    } catch (err) {
      console.error("Failed to load collections:", err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, setCollections]);

  // Create collection
  const createCollection = useCallback(
    async (data: CreateCollectionData): Promise<Collection | null> => {
      if (!workspaceId || !data.name.trim()) {
        return null;
      }

      try {
        const collection = await createCollectionApi(workspaceId, {
          name: data.name.trim(),
          icon: data.icon,
        });
        setCollections((prev) => [...prev, collection as CollectionData]);
        triggerCollectionsRefresh();
        return collection;
      } catch (err) {
        console.error("Failed to create collection:", err);
        showError(
          t("workspace.createCollectionError") || "Failed to create collection",
        );
        return null;
      }
    },
    [workspaceId, setCollections, triggerCollectionsRefresh],
  );

  // Update collection
  const updateCollection = useCallback(
    async (
      id: string,
      data: UpdateCollectionData,
    ): Promise<Collection | null> => {
      try {
        const updated = await updateCollectionApi(id, {
          name: data.name?.trim(),
          icon: data.icon || undefined,
        });
        setCollections((prev) =>
          prev.map((c) =>
            c.id === updated.id ? (updated as CollectionData) : c,
          ),
        );
        triggerCollectionsRefresh();
        return updated;
      } catch (err) {
        console.error("Failed to update collection:", err);
        showError(
          t("workspace.updateCollectionError") || "Failed to update collection",
        );
        return null;
      }
    },
    [setCollections, triggerCollectionsRefresh],
  );

  // Delete collection
  const deleteCollection = useCallback(
    async (collectionId: string): Promise<boolean> => {
      if (!confirm(t("workspace.confirmDeleteCollection"))) {
        return false;
      }

      try {
        await deleteCollectionApi(collectionId);
        setCollections((prev) => prev.filter((c) => c.id !== collectionId));
        if (activeCollectionId === collectionId) {
          setActiveCollectionId(privateCollection?.id || null);
        }
        triggerCollectionsRefresh();
        return true;
      } catch (err) {
        console.error("Failed to delete collection:", err);
        showError(
          t("workspace.deleteCollectionError") || "Failed to delete collection",
        );
        return false;
      }
    },
    [
      activeCollectionId,
      privateCollection,
      setActiveCollectionId,
      setCollections,
      triggerCollectionsRefresh,
    ],
  );

  // Set default active collection to Private when collections are loaded
  useEffect(() => {
    if (
      collections.length > 0 &&
      !activeCollectionId &&
      !hasSetDefaultCollectionRef.current
    ) {
      const privateCol = collections.find((c) => c.isPrivate);
      if (privateCol) {
        hasSetDefaultCollectionRef.current = true;
        setActiveCollectionId(privateCol.id);
      }
    }
  }, [collections, activeCollectionId, setActiveCollectionId]);

  // Reset the default collection flag when workspace changes
  useEffect(() => {
    hasSetDefaultCollectionRef.current = false;
  }, [workspaceId]);

  // Load collections when workspace changes
  useEffect(() => {
    if (workspaceId) {
      loadCollections();
    }
  }, [workspaceId, loadCollections]);

  return {
    collections: collections as Collection[],
    isLoading,
    activeCollectionId,
    setActiveCollectionId,
    privateCollection: privateCollection as Collection | undefined,
    activeCollection: activeCollection as Collection | null,
    loadCollections,
    createCollection,
    updateCollection,
    deleteCollection,
  };
}
