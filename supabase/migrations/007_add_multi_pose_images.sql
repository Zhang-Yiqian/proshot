-- 为 generations 表添加多姿势图 URL 数组字段
ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS multi_pose_image_urls TEXT[] DEFAULT '{}';
