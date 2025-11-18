// Content moderation utilities

// Common spam keywords (expandable)
const SPAM_KEYWORDS = [
  'viagra', 'cialis', 'casino', 'lottery', 'prize winner',
  'click here now', 'act now', 'limited time', 'buy now',
  'make money fast', 'work from home', 'free money'
];

// Profanity filter (basic list - expand as needed)
const PROFANITY_LIST = [
  'badword1', 'badword2', // Replace with actual words
];

export interface ModerationResult {
  flagged: boolean;
  reasons: string[];
  score: number;
}

export const moderateContent = (content: string, title?: string): ModerationResult => {
  const reasons: string[] = [];
  let score = 0;

  const fullText = `${title || ''} ${content}`.toLowerCase();

  // Check for spam keywords
  const spamCount = SPAM_KEYWORDS.filter(keyword =>
    fullText.includes(keyword.toLowerCase())
  ).length;

  if (spamCount > 0) {
    reasons.push(`Contains ${spamCount} spam keyword(s)`);
    score += spamCount * 2;
  }

  // Check for profanity
  const profanityCount = PROFANITY_LIST.filter(word =>
    fullText.includes(word.toLowerCase())
  ).length;

  if (profanityCount > 0) {
    reasons.push(`Contains ${profanityCount} inappropriate word(s)`);
    score += profanityCount * 3;
  }

  // Check for excessive links
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) {
    reasons.push('Contains excessive links');
    score += 3;
  }

  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 20) {
    reasons.push('Excessive capitalization');
    score += 2;
  }

  // Check for repetitive content
  const words = content.split(/\s+/);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const repetitionRatio = 1 - (uniqueWords.size / words.length);

  if (repetitionRatio > 0.7 && words.length > 10) {
    reasons.push('Highly repetitive content');
    score += 2;
  }

  // Check for very short content with links
  if (content.length < 50 && linkCount > 0) {
    reasons.push('Suspiciously short content with links');
    score += 2;
  }

  return {
    flagged: score >= 5,
    reasons,
    score
  };
};

export const checkDuplicateContent = async (
  content: string,
  userId: string,
  PostModel: any
): Promise<boolean> => {
  try {
    // Check for exact or very similar content from same user in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const similarPost = await PostModel.findOne({
      userId,
      description: { $regex: content.substring(0, 100), $options: 'i' },
      createdAt: { $gte: oneDayAgo }
    });

    return !!similarPost;
  } catch (error) {
    console.error('Duplicate check error:', error);
    return false;
  }
};
