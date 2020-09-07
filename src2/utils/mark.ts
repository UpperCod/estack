import { performance } from "perf_hooks";

interface Marks {
    [mark: string]: number;
}

function toHumanTime(ms: number) {
    ms = Math.ceil(ms);
    if (ms > 300) {
        return (ms / 1000).toFixed(2) + "s";
    } else {
        return ms + "ms";
    }
}

export function createMarks() {
    const marks: Marks = {};

    return function openMark(label: string) {
        if (!marks[label]) {
            marks[label] = performance.now();
        }
        return function closedMark(): string {
            if (marks[label]) {
                const diffTime = performance.now() - marks[label];
                marks[label] = 0;
                return toHumanTime(diffTime);
            }
        };
    };
}
