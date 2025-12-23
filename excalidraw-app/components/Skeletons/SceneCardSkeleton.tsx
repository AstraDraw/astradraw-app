import React from "react";

import "./Skeleton.scss";

/**
 * SceneCardSkeleton
 *
 * A skeleton placeholder that matches the SceneGridCard component dimensions.
 * Used in DashboardView and CollectionView while loading scenes.
 *
 * Dimensions (from SceneCardGrid.scss):
 * - Card: min-width 260px, border-radius 12px
 * - Thumbnail: aspect-ratio 16/10
 * - Info section: padding 12px 16px
 * - Title: font-size 15px, height ~20px
 * - Meta: font-size 13px, height ~16px
 */
export const SceneCardSkeleton: React.FC = () => {
  return (
    <div className="scene-card-skeleton">
      <div className="scene-card-skeleton__thumbnail">
        <div className="scene-card-skeleton__time-badge" />
      </div>
      <div className="scene-card-skeleton__info">
        <div className="scene-card-skeleton__title-row">
          <div className="scene-card-skeleton__title" />
          <div className="scene-card-skeleton__icon" />
        </div>
        <div className="scene-card-skeleton__meta" />
      </div>
    </div>
  );
};

interface SceneCardSkeletonGridProps {
  count?: number;
}

/**
 * SceneCardSkeletonGrid
 *
 * Renders multiple SceneCardSkeleton components in a grid layout.
 * Matches the SceneCardGrid component layout.
 */
export const SceneCardSkeletonGrid: React.FC<SceneCardSkeletonGridProps> = ({
  count = 6,
}) => {
  return (
    <div className="skeleton-grid skeleton-container">
      {Array.from({ length: count }).map((_, index) => (
        <SceneCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default SceneCardSkeleton;
