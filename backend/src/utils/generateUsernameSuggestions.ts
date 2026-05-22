import UserModel from "../models/Users";

//TODO: may need any optmisiation or incresase the max attempts to 30 or 50
export const generateUsernameSuggestions = async (
  username: string,
  maxSuggestions = 2
): Promise<string[]> => {
  const suggestions = new Set<string>();
  const MAX_ATTEMPTS = 15;

  const generateRandomUsername = (): string => {
    const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    return Math.random() < 0.5
      ? `${username}${suffix}`
      : `${username}_${suffix}`;
  };

  // Step 1: Generate pool
  while (suggestions.size < MAX_ATTEMPTS) {
    suggestions.add(generateRandomUsername());
  }

  const candidates = Array.from(suggestions);

  // Step 2: Check for existing usernames
  const existingUsers = await UserModel.find({
    username: { $in: candidates },
  }).lean();

  const takenUsernames = new Set(existingUsers.map((u) => u.username));

  // Step 3: Filter available
  const availableSuggestions = candidates.filter(
    (name) => !takenUsernames.has(name)
  );

  // ✅ Step 4: Fallback in case none are available
  if (availableSuggestions.length === 0) {
    return [`${username}_${Date.now()}`]; // fallback unique suggestion
  }

  // Step 5: Return the number of suggestions needed
  return availableSuggestions.slice(0, maxSuggestions);
};
