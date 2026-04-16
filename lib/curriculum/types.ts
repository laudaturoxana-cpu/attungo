export type CurriculumType = "RO_NATIONAL" | "US_COMMON_CORE" | "EN_CAMBRIDGE" | "US_HOMESCHOOL";

export interface SubjectCurriculum {
  key_topics: string[];
  competences: string[];
  typical_mistakes: string[];
  prerequisite_grade: number | null;
}

export interface GradeCurriculum {
  curriculum: CurriculumType;
  grade: number;
  language: "ro" | "en";
  subjects: Record<string, SubjectCurriculum>;
}
