import type { CurriculumType, GradeCurriculum } from "./types";

// RO_NATIONAL
import roGrade1 from "./ro_national/grade1.json";
import roGrade2 from "./ro_national/grade2.json";
import roGrade3 from "./ro_national/grade3.json";
import roGrade4 from "./ro_national/grade4.json";
import roGrade5 from "./ro_national/grade5.json";
import roGrade6 from "./ro_national/grade6.json";
import roGrade7 from "./ro_national/grade7.json";
import roGrade8 from "./ro_national/grade8.json";

// US_COMMON_CORE
import usccGrade1 from "./us_common_core/grade1.json";
import usccGrade2 from "./us_common_core/grade2.json";
import usccGrade3 from "./us_common_core/grade3.json";
import usccGrade4 from "./us_common_core/grade4.json";
import usccGrade5 from "./us_common_core/grade5.json";
import usccGrade6 from "./us_common_core/grade6.json";
import usccGrade7 from "./us_common_core/grade7.json";
import usccGrade8 from "./us_common_core/grade8.json";

// EN_CAMBRIDGE
import camGrade1 from "./en_cambridge/grade1.json";
import camGrade2 from "./en_cambridge/grade2.json";
import camGrade3 from "./en_cambridge/grade3.json";
import camGrade4 from "./en_cambridge/grade4.json";
import camGrade5 from "./en_cambridge/grade5.json";
import camGrade6 from "./en_cambridge/grade6.json";
import camGrade7 from "./en_cambridge/grade7.json";
import camGrade8 from "./en_cambridge/grade8.json";

// US_HOMESCHOOL (Core Knowledge Sequence)
import hsGrade1 from "./us_homeschool/grade1.json";
import hsGrade2 from "./us_homeschool/grade2.json";
import hsGrade3 from "./us_homeschool/grade3.json";
import hsGrade4 from "./us_homeschool/grade4.json";
import hsGrade5 from "./us_homeschool/grade5.json";
import hsGrade6 from "./us_homeschool/grade6.json";
import hsGrade7 from "./us_homeschool/grade7.json";
import hsGrade8 from "./us_homeschool/grade8.json";

const CURRICULUM_DATA: Record<CurriculumType, Record<number, GradeCurriculum>> = {
  RO_NATIONAL: {
    1: roGrade1 as GradeCurriculum,
    2: roGrade2 as GradeCurriculum,
    3: roGrade3 as GradeCurriculum,
    4: roGrade4 as GradeCurriculum,
    5: roGrade5 as GradeCurriculum,
    6: roGrade6 as GradeCurriculum,
    7: roGrade7 as GradeCurriculum,
    8: roGrade8 as GradeCurriculum,
  },
  US_COMMON_CORE: {
    1: usccGrade1 as GradeCurriculum,
    2: usccGrade2 as GradeCurriculum,
    3: usccGrade3 as GradeCurriculum,
    4: usccGrade4 as GradeCurriculum,
    5: usccGrade5 as GradeCurriculum,
    6: usccGrade6 as GradeCurriculum,
    7: usccGrade7 as GradeCurriculum,
    8: usccGrade8 as GradeCurriculum,
  },
  EN_CAMBRIDGE: {
    1: camGrade1 as GradeCurriculum,
    2: camGrade2 as GradeCurriculum,
    3: camGrade3 as GradeCurriculum,
    4: camGrade4 as GradeCurriculum,
    5: camGrade5 as GradeCurriculum,
    6: camGrade6 as GradeCurriculum,
    7: camGrade7 as GradeCurriculum,
    8: camGrade8 as GradeCurriculum,
  },
  US_HOMESCHOOL: {
    1: hsGrade1 as GradeCurriculum,
    2: hsGrade2 as GradeCurriculum,
    3: hsGrade3 as GradeCurriculum,
    4: hsGrade4 as GradeCurriculum,
    5: hsGrade5 as GradeCurriculum,
    6: hsGrade6 as GradeCurriculum,
    7: hsGrade7 as GradeCurriculum,
    8: hsGrade8 as GradeCurriculum,
  },
};

/**
 * Returns the curriculum data for a specific curriculum type and grade.
 * @param curriculum - The curriculum type identifier
 * @param grade - The grade number (1-8)
 * @returns GradeCurriculum or null if not found
 */
export function getCurriculumForGrade(
  curriculum: CurriculumType,
  grade: number
): GradeCurriculum | null {
  if (grade < 1 || grade > 8) {
    console.warn(`[Attungo Curriculum] Grade ${grade} is out of range (1-8)`);
    return null;
  }
  const data = CURRICULUM_DATA[curriculum]?.[grade];
  if (!data) {
    console.warn(`[Attungo Curriculum] No data found for ${curriculum} grade ${grade}`);
    return null;
  }
  return data;
}

/**
 * Returns all subjects for a given curriculum and grade.
 * @param curriculum - The curriculum type identifier
 * @param grade - The grade number (1-8)
 * @returns Array of subject names or empty array
 */
export function getSubjectsForGrade(
  curriculum: CurriculumType,
  grade: number
): string[] {
  const data = getCurriculumForGrade(curriculum, grade);
  return data ? Object.keys(data.subjects) : [];
}

/**
 * Returns the topics for a specific subject within a curriculum and grade.
 * @param curriculum - The curriculum type identifier
 * @param grade - The grade number (1-8)
 * @param subject - The subject name (must match exactly)
 * @returns Array of key topics or empty array
 */
export function getTopicsForSubject(
  curriculum: CurriculumType,
  grade: number,
  subject: string
): string[] {
  const data = getCurriculumForGrade(curriculum, grade);
  return data?.subjects[subject]?.key_topics ?? [];
}

/**
 * Returns the typical mistakes for a specific subject within a curriculum and grade.
 * Useful for the AI tutor to anticipate and address common errors.
 * @param curriculum - The curriculum type identifier
 * @param grade - The grade number (1-8)
 * @param subject - The subject name (must match exactly)
 * @returns Array of typical mistake descriptions or empty array
 */
export function getTypicalMistakesForSubject(
  curriculum: CurriculumType,
  grade: number,
  subject: string
): string[] {
  const data = getCurriculumForGrade(curriculum, grade);
  return data?.subjects[subject]?.typical_mistakes ?? [];
}

/**
 * Returns the full curriculum data map for quick lookup.
 */
export function getAllCurriculumData(): Record<CurriculumType, Record<number, GradeCurriculum>> {
  return CURRICULUM_DATA;
}

// Re-export types
export type { CurriculumType, GradeCurriculum, SubjectCurriculum } from "./types";
