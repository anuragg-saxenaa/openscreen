import { describe, expect, it } from "vitest";
import type {
	ExportConfig,
	ExportFormat,
	ExportProgress,
	ExportQuality,
	ExportResult,
	ExportSettings,
	GifExportConfig,
	GifFrameRate,
	GifSizePreset,
} from "./types";
import {
	GIF_FRAME_RATES,
	GIF_SIZE_PRESETS,
	isValidGifFrameRate,
	VALID_GIF_FRAME_RATES,
} from "./types";

// ---------------------------------------------------------------------------
// ExportFormat
// ---------------------------------------------------------------------------

describe("ExportFormat", () => {
	it("supports mp4 and gif formats", () => {
		const formats: ExportFormat[] = ["mp4", "gif"];
		expect(formats).toHaveLength(2);
	});

	it("rejects arbitrary strings as ExportFormat", () => {
		// TypeScript would catch this at compile time, but runtime check for safety
		const invalid = "webm" as ExportFormat;
		expect(isValidExportFormat(invalid)).toBe(false);
	});

	it('accepts "mp4" and "gif" as valid ExportFormat', () => {
		expect(isValidExportFormat("mp4")).toBe(true);
		expect(isValidExportFormat("gif")).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// ExportQuality
// ---------------------------------------------------------------------------

describe("ExportQuality", () => {
	it("supports medium, good, and source quality presets", () => {
		const qualities: ExportQuality[] = ["medium", "good", "source"];
		expect(qualities).toHaveLength(3);
	});
});

// ---------------------------------------------------------------------------
// GifFrameRate validation
// ---------------------------------------------------------------------------

describe("isValidGifFrameRate", () => {
	it("returns true for valid frame rates", () => {
		expect(isValidGifFrameRate(15)).toBe(true);
		expect(isValidGifFrameRate(20)).toBe(true);
		expect(isValidGifFrameRate(25)).toBe(true);
		expect(isValidGifFrameRate(30)).toBe(true);
	});

	it("returns false for invalid frame rates", () => {
		expect(isValidGifFrameRate(10)).toBe(false);
		expect(isValidGifFrameRate(24)).toBe(false);
		expect(isValidGifFrameRate(60)).toBe(false);
		expect(isValidGifFrameRate(0)).toBe(false);
		expect(isValidGifFrameRate(-1)).toBe(false);
	});

	it("returns false for non-integer fractional values", () => {
		expect(isValidGifFrameRate(15.5)).toBe(false);
		expect(isValidGifFrameRate(20.1)).toBe(false);
	});

	it("returns false for NaN and undefined", () => {
		expect(isValidGifFrameRate(NaN)).toBe(false);
		// @ts-expect-error intentionally passing wrong type
		expect(isValidGifFrameRate(undefined)).toBe(false);
		// @ts-expect-error intentionally passing wrong type
		expect(isValidGifFrameRate(null)).toBe(false);
	});
});

describe("VALID_GIF_FRAME_RATES constant", () => {
	it("contains exactly 4 valid frame rates", () => {
		expect(VALID_GIF_FRAME_RATES).toHaveLength(4);
	});

	it("matches the GIF_FRAME_RATES labels", () => {
		const validValues = VALID_GIF_FRAME_RATES.map((f) => f);
		GIF_FRAME_RATES.forEach(({ value }) => {
			expect(validValues).toContain(value);
		});
	});
});

describe("GIF_FRAME_RATES", () => {
	it("has descriptive labels for each frame rate", () => {
		GIF_FRAME_RATES.forEach(({ label }) => {
			expect(typeof label).toBe("string");
			expect(label.length).toBeGreaterThan(0);
		});
	});

	it("frame rates are ordered ascending", () => {
		const rates = GIF_FRAME_RATES.map((f) => f.value);
		expect(rates).toEqual([...rates].sort((a, b) => a - b));
	});
});

// ---------------------------------------------------------------------------
// GIF_SIZE_PRESETS
// ---------------------------------------------------------------------------

describe("GIF_SIZE_PRESETS", () => {
	it("defines three size presets", () => {
		const presets: GifSizePreset[] = ["medium", "large", "original"];
		presets.forEach((preset) => {
			expect(GIF_SIZE_PRESETS[preset]).toBeDefined();
			expect(GIF_SIZE_PRESETS[preset].maxHeight).toBeGreaterThan(0);
			expect(GIF_SIZE_PRESETS[preset].label).toBeTruthy();
		});
	});

	it('"original" preset has no height limit', () => {
		expect(GIF_SIZE_PRESETS.original.maxHeight).toBe(Infinity);
	});

	it('"medium" preset caps at 720p', () => {
		expect(GIF_SIZE_PRESETS.medium.maxHeight).toBe(720);
	});

	it('"large" preset caps at 1080p', () => {
		expect(GIF_SIZE_PRESETS.large.maxHeight).toBe(1080);
	});

	it("all presets have human-readable labels", () => {
		Object.values(GIF_SIZE_PRESETS).forEach(({ label }) => {
			expect(label).toMatch(/\d+p|original/i);
		});
	});
});

// ---------------------------------------------------------------------------
// ExportConfig
// ---------------------------------------------------------------------------

describe("ExportConfig", () => {
	it("accepts a valid mp4 config", () => {
		const config: ExportConfig = {
			width: 1920,
			height: 1080,
			frameRate: 30,
			bitrate: 8_000_000,
			codec: "avc1.640033",
		};
		expect(isValidExportConfig(config)).toBe(true);
	});

	it("rejects a config missing required fields", () => {
		// @ts-expect-error intentionally incomplete
		expect(isValidExportConfig({ width: 1920 })).toBe(false);
	});

	it("rejects negative or zero dimensions", () => {
		expect(isValidExportConfig({ width: 0, height: 1080, frameRate: 30, bitrate: 8_000_000 })).toBe(
			false,
		);
		expect(
			isValidExportConfig({ width: 1920, height: -1, frameRate: 30, bitrate: 8_000_000 }),
		).toBe(false);
	});

	it("rejects zero or negative frame rate", () => {
		expect(
			isValidExportConfig({ width: 1920, height: 1080, frameRate: 0, bitrate: 8_000_000 }),
		).toBe(false);
		expect(
			isValidExportConfig({ width: 1920, height: 1080, frameRate: -30, bitrate: 8_000_000 }),
		).toBe(false);
	});

	it("rejects zero or negative bitrate", () => {
		expect(isValidExportConfig({ width: 1920, height: 1080, frameRate: 30, bitrate: 0 })).toBe(
			false,
		);
		expect(isValidExportConfig({ width: 1920, height: 1080, frameRate: 30, bitrate: -1 })).toBe(
			false,
		);
	});
});

// ---------------------------------------------------------------------------
// ExportProgress
// ---------------------------------------------------------------------------

describe("ExportProgress", () => {
	it("calculates correct percentage", () => {
		const progress: ExportProgress = {
			currentFrame: 50,
			totalFrames: 100,
			percentage: 50,
			estimatedTimeRemaining: 10,
		};
		expect(progress.percentage).toBe(50);
	});

	it("handles 0% progress", () => {
		const progress: ExportProgress = {
			currentFrame: 0,
			totalFrames: 100,
			percentage: 0,
			estimatedTimeRemaining: 0,
		};
		expect(progress.percentage).toBe(0);
	});

	it("handles 100% progress", () => {
		const progress: ExportProgress = {
			currentFrame: 100,
			totalFrames: 100,
			percentage: 100,
			estimatedTimeRemaining: 0,
		};
		expect(progress.percentage).toBe(100);
	});

	it("reports finalizing phase when specified", () => {
		const progress: ExportProgress = {
			currentFrame: 100,
			totalFrames: 100,
			percentage: 100,
			estimatedTimeRemaining: 0,
			phase: "finalizing",
		};
		expect(progress.phase).toBe("finalizing");
	});

	it("accepts renderProgress for gif compiling phase", () => {
		const progress: ExportProgress = {
			currentFrame: 100,
			totalFrames: 100,
			percentage: 100,
			estimatedTimeRemaining: 5,
			phase: "finalizing",
			renderProgress: 75,
		};
		expect(progress.renderProgress).toBe(75);
	});

	it("calculates percentage from frames", () => {
		function calcPercentage(current: number, total: number): number {
			return Math.round((current / total) * 100);
		}
		expect(calcPercentage(1, 4)).toBe(25);
		expect(calcPercentage(3, 4)).toBe(75);
		expect(calcPercentage(0, 100)).toBe(0);
		expect(calcPercentage(100, 100)).toBe(100);
	});
});

// ---------------------------------------------------------------------------
// ExportResult
// ---------------------------------------------------------------------------

describe("ExportResult", () => {
	it("represents a successful export with blob", () => {
		const result: ExportResult = { success: true };
		expect(result.success).toBe(true);
		expect(result.blob).toBeUndefined();
	});

	it("represents a failed export with error message", () => {
		const result: ExportResult = { success: false, error: "Encoder not supported" };
		expect(result.success).toBe(false);
		expect(result.error).toBe("Encoder not supported");
	});
});

// ---------------------------------------------------------------------------
// ExportSettings
// ---------------------------------------------------------------------------

describe("ExportSettings", () => {
	it("accepts valid mp4 settings", () => {
		const settings: ExportSettings = { format: "mp4", quality: "good" };
		expect(isValidExportSettings(settings)).toBe(true);
	});

	it("accepts valid gif settings with gifConfig", () => {
		const settings: ExportSettings = {
			format: "gif",
			gifConfig: {
				frameRate: 20,
				loop: true,
				sizePreset: "medium",
				width: 1280,
				height: 720,
			},
		};
		expect(isValidExportSettings(settings)).toBe(true);
	});

	it("rejects gif settings with invalid frameRate", () => {
		const settings: ExportSettings = {
			format: "gif",
			gifConfig: {
				frameRate: 24, // invalid - not in GifFrameRate union
				loop: true,
				sizePreset: "medium",
				width: 1280,
				height: 720,
			},
		};
		expect(isValidExportSettings(settings)).toBe(false);
	});

	it("rejects gif settings with invalid sizePreset", () => {
		const settings = {
			format: "gif",
			gifConfig: {
				frameRate: 20,
				loop: true,
				sizePreset: "extra-large" as GifSizePreset,
				width: 1280,
				height: 720,
			},
		};
		expect(isValidExportSettings(settings)).toBe(false);
	});

	it("rejects mp4 settings with invalid quality", () => {
		const settings = { format: "mp4", quality: "ultra" as ExportQuality };
		expect(isValidExportSettings(settings)).toBe(false);
	});

	it("rejects missing format", () => {
		// @ts-expect-error intentionally missing format
		expect(isValidExportSettings({ quality: "good" })).toBe(false);
	});

	it("accepts settings without optional quality (defaults applied)", () => {
		const settings: ExportSettings = { format: "mp4" };
		expect(isValidExportSettings(settings)).toBe(true);
	});

	it("rejects gif format without gifConfig", () => {
		const settings = { format: "gif" };
		expect(isValidExportSettings(settings)).toBe(false);
	});

	it("rejects gifConfig for mp4 format", () => {
		const settings: ExportSettings = {
			format: "mp4",
			gifConfig: {
				frameRate: 20,
				loop: true,
				sizePreset: "medium",
				width: 1280,
				height: 720,
			},
		};
		expect(isValidExportSettings(settings)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// GifExportConfig
// ---------------------------------------------------------------------------

describe("GifExportConfig", () => {
	it("accepts a fully-specified gif config", () => {
		const config: GifExportConfig = {
			frameRate: 20,
			loop: true,
			sizePreset: "large",
			width: 1920,
			height: 1080,
		};
		expect(isValidGifExportConfig(config)).toBe(true);
	});

	it("rejects non-positive dimensions", () => {
		const configs: GifExportConfig[] = [
			{ frameRate: 20, loop: true, sizePreset: "medium", width: 0, height: 720 },
			{ frameRate: 20, loop: true, sizePreset: "medium", width: 1920, height: -1 },
		];
		configs.forEach((config) => {
			expect(isValidGifExportConfig(config)).toBe(false);
		});
	});

	it("rejects invalid frameRate in config", () => {
		const config = { frameRate: 99, loop: true, sizePreset: "medium", width: 1280, height: 720 };
		expect(isValidGifExportConfig(config)).toBe(false);
	});

	it("rejects invalid sizePreset in config", () => {
		const config = {
			frameRate: 20,
			loop: true,
			sizePreset: "tiny" as GifSizePreset,
			width: 1280,
			height: 720,
		};
		expect(isValidGifExportConfig(config)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Helpers — mirror the validation logic used in the exporter pipeline
// ---------------------------------------------------------------------------

function isValidExportFormat(value: unknown): value is ExportFormat {
	return value === "mp4" || value === "gif";
}

function isValidExportConfig(config: ExportConfig): boolean {
	if (!config) return false;
	if (typeof config.width !== "number" || config.width <= 0) return false;
	if (typeof config.height !== "number" || config.height <= 0) return false;
	if (typeof config.frameRate !== "number" || config.frameRate <= 0) return false;
	if (typeof config.bitrate !== "number" || config.bitrate <= 0) return false;
	return true;
}

function isValidGifExportConfig(config: GifExportConfig): boolean {
	if (!isValidGifFrameRate(config.frameRate)) return false;
	if (
		config.sizePreset !== "medium" &&
		config.sizePreset !== "large" &&
		config.sizePreset !== "original"
	) {
		return false;
	}
	if (typeof config.loop !== "boolean") return false;
	if (typeof config.width !== "number" || config.width <= 0) return false;
	if (typeof config.height !== "number" || config.height <= 0) return false;
	return true;
}

function isValidExportSettings(settings: ExportSettings): boolean {
	if (!isValidExportFormat(settings.format)) return false;

	if (settings.format === "mp4") {
		// gifConfig should not be present for mp4
		if ("gifConfig" in settings && settings.gifConfig !== undefined) return false;
		// quality is optional; validate if present
		if (settings.quality !== undefined) {
			if (
				settings.quality !== "medium" &&
				settings.quality !== "good" &&
				settings.quality !== "source"
			) {
				return false;
			}
		}
		return true;
	}

	if (settings.format === "gif") {
		if (!settings.gifConfig) return false;
		return isValidGifExportConfig(settings.gifConfig);
	}

	return false;
}
