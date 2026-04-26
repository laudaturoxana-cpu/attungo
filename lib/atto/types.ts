export interface ChildProfile {
  learning_visual: number;
  learning_auditory: number;
  learning_logical: number;
  learning_kinesthetic: number;
  passion_sport: number;
  passion_music: number;
  passion_tech: number;
  passion_stories: number;
  passion_animals: number;
  passion_art: number;
  passion_science: number;
  positive_anchors: string[];
  current_energy: string;
  common_mistakes: Record<string, unknown>;
}
