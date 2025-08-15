export type FirestoreTimestamp = {
    _seconds: number;
    _nanoseconds: number;
};

export const firestoreTimestampToDate = (timestamp: unknown): Date | null => {
    if (!timestamp) return null;

    const ts = timestamp as FirestoreTimestamp;
    if (ts && typeof ts._seconds === "number") {
        return new Date(ts._seconds * 1000 + (ts._nanoseconds || 0) / 1000000);
    }

    if (timestamp instanceof Date) {
        return timestamp;
    }

    if (typeof timestamp === "string") {
        return new Date(timestamp);
    }

    if (typeof timestamp === "number") {
        return new Date(timestamp);
    }

    return null;
};

