import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';
import { fileTypeFromBuffer } from 'file-type';

async function extractExamToJson(filePath) {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = await fileTypeFromBuffer(buffer);
    let text = "";

    try {
        if ((type && type.ext === 'doc') || ext === '.doc') {
            const extractor = new WordExtractor();
            const doc = await extractor.extract(filePath);
            text = doc.getBody();
        } else if ((type && type.ext === 'docx') || ext === '.docx') {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else {
            throw new Error("Unsupported file format.");
        }

        const questions = parseQuestionsWithSections(text);
        const jsonFilePath = filePath.replace(/\.(docx?|DOCX?)$/, ".json");
        fs.writeFileSync(jsonFilePath, JSON.stringify(questions, null, 2), "utf-8");
        console.log(`Output saved to ${jsonFilePath}`);
    } catch (err) {
        console.error("Error extracting exam:", err.message);
    }
}

function cleanOptionText(text) {
    const parts = text.split(/\n+/);
    return parts[0].trim();
}

function parseQuestionsWithSections(rawText) {
    const splitIndex = rawText.search(/(?:答案|Answers?)[:：]?\s*\n?/i);
    const mainText = splitIndex !== -1 ? rawText.slice(0, splitIndex) : rawText;
    const answerSectionRaw = splitIndex !== -1 ? rawText.slice(splitIndex) : "";

    const regex = /(?:^|\n)(\d+)[．.、]?\s*(.+?)\s*\n+A[．.、]?\s*(.+?)\s*\n+B[．.、]?\s*(.+?)\s*\n+C[．.、]?\s*(.+?)\s*\n+D[．.、]?\s*(.+?)(?=(\n+\d+[．.、]|$))/gsu;
    const choiceMatches = [...mainText.matchAll(regex)];

    const shortAnswerRegex = /三、简答题.*?(?=\n{2,}|$)([\s\S]*)/;
    const shortAnswerBlock = mainText.match(shortAnswerRegex)?.[1] || "";
    const shortAnswerQs = [...shortAnswerBlock.matchAll(/(\d+)[．.、]?\s*(.+?)(?=(\n\d+[．.、]|$))/gsu)];

    const allAnswers = extractAllAnswers(answerSectionRaw);
    console.log("answerSectionRaw:", answerSectionRaw);
    const shortAnswerAnswers = extractShortAnswerAnswers(answerSectionRaw);

    const questions = [];
    const seenNumbers = new Set();
    let currentSection = 1;

    for (const m of choiceMatches) {
        const qNum = parseInt(m[1], 10);
        if (seenNumbers.has(qNum)) {
            currentSection++;
            seenNumbers.clear();
        }
        seenNumbers.add(qNum);

        questions.push({
            section: currentSection,
            no: qNum,
            question: m[2].trim(),
            option: {
                A: cleanOptionText(m[3]),
                B: cleanOptionText(m[4]),
                C: cleanOptionText(m[5]),
                D: cleanOptionText(m[6]),
            },
            answer: allAnswers[currentSection]?.[qNum] || ""
        });
    }

    if (shortAnswerQs.length > 0) {
        currentSection++;
        for (const m of shortAnswerQs) {
            const qNum = parseInt(m[1], 10);
            const questionText = m[2].trim();
            const answerText = shortAnswerAnswers[qNum] || "";
            questions.push({
                section: currentSection,
                no: qNum,
                question: questionText,
                answer: answerText
            });
        }
    }

    return questions;
}

function extractAllAnswers(answerText = "") {
    const sectionAnswers = {};
    let sectionIndex = 1;
    let currentAnswers = {};

    const lines = answerText.split(/\n+/);

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (/^[一二三四五六七八九十]+[、.\s]+/.test(trimmedLine)) {
            if (Object.keys(currentAnswers).length > 0) {
                sectionAnswers[sectionIndex] = currentAnswers;
                sectionIndex++;
                currentAnswers = {};
            }
            continue;
        }

        const matches = [...trimmedLine.matchAll(/(\d+)[．.、]?\s*([A-D](?:\s*,\s*[A-D])*)/gi)];
        for (const match of matches) {
            const qNum = parseInt(match[1], 10);
            const parts = match[2].split(/\s*,\s*/).map(a => a.toUpperCase());
            currentAnswers[qNum] = parts.length === 1 ? parts[0] : parts;
        }
    }

    if (Object.keys(currentAnswers).length > 0) {
        sectionAnswers[sectionIndex] = currentAnswers;
    }

    return sectionAnswers;
}

function extractShortAnswerAnswers(answerText = "") {
    const result = {};
    const matches = [...answerText.matchAll(/(\d+)[、.\s]*答案要点[:：]?\s*([\s\S]*?)(?=(\n\d+[、.]|\n[一二三四五六七八九十][、.\s]|$))/g)];
    console.log("Short answer matches:", matches);
    for (const match of matches) {
        const qNum = parseInt(match[1], 10);
        const answer = match[2].trim();
        result[qNum] = answer;
    }
    return result;
}

// CLI usage
const inputFile = process.argv[2];
if (!inputFile) {
    console.log("Usage: node extractExam.mjs yourfile.docx");
} else {
    extractExamToJson(inputFile);
}
