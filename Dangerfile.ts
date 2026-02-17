import { danger, warn, markdown } from "danger";
import { reviewCode } from "./scripts/ai-pr-reviewer";

// Check for PR description
if (danger.github.pr.body.length < 10) {
    warn("Please include a description for your PR.");
}

// Check for changed files
const hasChangedFiles = danger.git.modified_files.length > 0;
if (!hasChangedFiles) {
    warn("This PR does not modify any files.");
}

// Check for tests
const hasTests = danger.git.modified_files.some((file) =>
    file.includes(".test.") || file.includes(".spec.")
);
const hasCodeChanges = danger.git.modified_files.some((file) =>
    file.startsWith("src/")
);

if (hasCodeChanges && !hasTests) {
    warn("You've modified code but haven't added or updated tests.");
}

// Check for large PRs
const bigPRThreshold = 500;
if (danger.github.pr.additions + danger.github.pr.deletions > bigPRThreshold) {
    warn("Big PR! 😅 Please try to keep PRs smaller next time for easier review.");
}

// AI Code Review
(async () => {
    const aiReviewableFiles = danger.git.modified_files.filter(
        (file) =>
            (file.endsWith(".ts") || file.endsWith(".tsx")) &&
            !file.includes("test") &&
            !file.includes("spec")
    );

    // Limit to 5 files
    for (const file of aiReviewableFiles.slice(0, 5)) {
        const diff = await danger.git.diffForFile(file);
        if (diff && diff.diff) {
            const feedback = await reviewCode(file, diff.diff);
            if (feedback && !feedback.includes("LGTM")) {
                markdown(`### AI Review for \`${file}\`\n\n${feedback}`);
            }
        }
    }
})();
