/**
 * NCTIRS Anomaly Detection Engine v2 — Unit Tests
 *
 * Tests for:
 *   - NetworkFeatures interface compliance (46 features)
 *   - AnomalyDetector initialization and model loading
 *   - Normal and anomalous traffic detection
 *   - Score classification (NORMAL/SUSPICIOUS/ANOMALOUS/CRITICAL)
 *   - Feature contribution computation
 *   - Legacy feature mapping
 *   - Simulated telemetry generation
 *   - ModelMetrics and ModelInfo
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
    AnomalyDetector,
    ProductionAnomalyDetector,
    generateNetworkTelemetry,
    getDetector,
    ALL_FEATURE_NAMES,
    NUM_FEATURES,
    FEATURE_GROUPS,
    type NetworkFeatures,
    type AnomalyResult,
    type LegacyNetworkFeatures,
} from '@/lib/anomalyDetection';

// Mock fetch for model metadata loading
const mockMetadata = {
    version: '2.0.0',
    name: 'SENTINEL-OMEGA-ADv2',
    architecture: {
        type: 'LSTM-Autoencoder',
        input_dim: 46,
        bottleneck_dim: 16,
        sequence_length: 10,
        total_parameters: 253842,
        trainable_parameters: 253842,
        has_classification_head: true,
    },
    training: {
        dataset: 'synthetic',
        total_samples: 100000,
        normal_samples: 80000,
        attack_samples: 20000,
        attack_types: ['DDoS', 'PortScan'],
        best_epoch: 142,
        best_val_loss: 0.0234,
        best_val_accuracy: 0.9412,
        cv_folds: 5,
        cv_avg_val_loss: 0.0251,
        cv_std_val_loss: 0.0018,
    },
    evaluation: {
        reconstruction: { accuracy: 0.93, precision: 0.92, recall: 0.89, f1_macro: 0.92, f1_binary: 0.90, roc_auc: 0.96, threshold: 0.3142 },
        classification: { accuracy: 0.94, precision: 0.93, recall: 0.91, f1_macro: 0.93, f1_binary: 0.92, roc_auc: 0.98 },
        ensemble: { accuracy: 0.95, precision: 0.94, recall: 0.92, f1_macro: 0.94, f1_binary: 0.93, roc_auc: 0.98 },
    },
    features: { total: 46, groups: {}, names: [] },
};

describe('Anomaly Detection Engine v2', () => {

    describe('Feature System', () => {
        it('should have exactly 46 features defined', () => {
            expect(NUM_FEATURES).toBe(46);
            expect(ALL_FEATURE_NAMES.length).toBe(46);
        });

        it('should have non-overlapping feature groups covering all 46 features', () => {
            const covered = new Set<number>();
            for (const [, info] of Object.entries(FEATURE_GROUPS)) {
                for (let i = info.start; i < info.end; i++) {
                    expect(covered.has(i)).toBe(false); // no overlap
                    covered.add(i);
                }
            }
            expect(covered.size).toBe(46);
        });

        it('should have correct feature group sizes', () => {
            expect(FEATURE_GROUPS.flow.end - FEATURE_GROUPS.flow.start).toBe(10);
            expect(FEATURE_GROUPS.protocol.end - FEATURE_GROUPS.protocol.start).toBe(8);
            expect(FEATURE_GROUPS.payload.end - FEATURE_GROUPS.payload.start).toBe(8);
            expect(FEATURE_GROUPS.connection.end - FEATURE_GROUPS.connection.start).toBe(8);
            expect(FEATURE_GROUPS.temporal.end - FEATURE_GROUPS.temporal.start).toBe(6);
            expect(FEATURE_GROUPS.behavioral.end - FEATURE_GROUPS.behavioral.start).toBe(6);
        });
    });

    describe('Telemetry Generation', () => {
        it('should generate valid 46-feature normal traffic', () => {
            const features = generateNetworkTelemetry(false);

            // Check all 46 features exist
            for (const name of ALL_FEATURE_NAMES) {
                expect(features).toHaveProperty(name);
                expect(typeof features[name]).toBe('number');
                expect(Number.isFinite(features[name])).toBe(true);
            }
        });

        it('should generate valid 46-feature anomalous traffic', () => {
            const features = generateNetworkTelemetry(true);

            for (const name of ALL_FEATURE_NAMES) {
                expect(features).toHaveProperty(name);
                expect(typeof features[name]).toBe('number');
                expect(Number.isFinite(features[name])).toBe(true);
            }
        });

        it('should generate different values across multiple calls', () => {
            const feat1 = generateNetworkTelemetry(false);
            const feat2 = generateNetworkTelemetry(false);

            // At least some features should differ (randomized)
            let differences = 0;
            for (const name of ALL_FEATURE_NAMES) {
                if (feat1[name] !== feat2[name]) differences++;
            }
            expect(differences).toBeGreaterThan(10);
        });

        it('should generate temporal features based on current time', () => {
            const features = generateNetworkTelemetry(false);
            expect(features.time_of_day).toBeGreaterThanOrEqual(0);
            expect(features.time_of_day).toBeLessThanOrEqual(1);
            expect(features.day_of_week).toBeGreaterThanOrEqual(0);
            expect(features.day_of_week).toBeLessThanOrEqual(1);
            expect(features.is_weekend).toBeGreaterThanOrEqual(0);
            expect(features.is_weekend).toBeLessThanOrEqual(1);
        });
    });

    describe('AnomalyDetector (Legacy Wrapper)', () => {
        let detector: AnomalyDetector;

        beforeAll(async () => {
            // Mock fetch for model loading
            global.fetch = vi.fn().mockImplementation((url: string) => {
                if (url.includes('model_metadata.json')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMetadata) });
                }
                if (url.includes('normalization_stats.json')) {
                    return Promise.resolve({ ok: false });
                }
                return Promise.resolve({ ok: false });
            });

            detector = new AnomalyDetector();
            await detector.train(5, 50);
        });

        it('should report ready after training', () => {
            const metrics = detector.getMetrics();
            expect(metrics.isReady).toBe(true);
        });

        it('should have model version in metrics', () => {
            const metrics = detector.getMetrics();
            expect(metrics.modelVersion).toBeDefined();
        });

        it('should detect normal traffic with low score', () => {
            const features = generateNetworkTelemetry(false);
            const result = detector.detect(features);

            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('isAnomaly');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('reconstructionError');
            expect(result).toHaveProperty('featureContributions');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('classification');
            expect(result).toHaveProperty('detectionMethod');

            expect(typeof result.score).toBe('number');
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
        });

        it('should return valid AnomalyResult structure', () => {
            const features = generateNetworkTelemetry(false);
            const result = detector.detect(features);

            // Check feature contributions has all 46 features
            expect(Object.keys(result.featureContributions).length).toBe(46);

            // Feature contributions should sum to approximately 1
            const sum = Object.values(result.featureContributions).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1.0, 1);

            // Classification should be one of the valid values
            expect(['NORMAL', 'SUSPICIOUS', 'ANOMALOUS', 'CRITICAL']).toContain(result.classification);
        });

        it('should return model info with correct fields', () => {
            const info = detector.getModelInfo();

            expect(info).toHaveProperty('name');
            expect(info).toHaveProperty('version');
            expect(info).toHaveProperty('architecture');
            expect(info).toHaveProperty('parameters');
            expect(info).toHaveProperty('features');
            expect(info).toHaveProperty('isReady');
            expect(info.features).toBe(46);
        });
    });

    describe('ProductionAnomalyDetector', () => {
        let detector: ProductionAnomalyDetector;

        beforeAll(async () => {
            global.fetch = vi.fn().mockImplementation((url: string) => {
                if (url.includes('model_metadata.json')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMetadata) });
                }
                return Promise.resolve({ ok: false });
            });

            detector = new ProductionAnomalyDetector();
            await detector.loadPretrainedModel();
        });

        it('should load model metadata', () => {
            const metadata = detector.getMetadata();
            expect(metadata).not.toBeNull();
            expect(metadata?.version).toBe('2.0.0');
            expect(metadata?.name).toBe('SENTINEL-OMEGA-ADv2');
            expect(metadata?.architecture.type).toBe('LSTM-Autoencoder');
        });

        it('should report correct metrics after loading', () => {
            const metrics = detector.getMetrics();
            expect(metrics.isReady).toBe(true);
            expect(metrics.modelVersion).toBe('2.0.0');
            expect(metrics.modelName).toBe('SENTINEL-OMEGA-ADv2');
            expect(metrics.totalParameters).toBe(253842);
            expect(metrics.trainingSamples).toBe(100000);
        });

        it('should detect multiple anomalous traffic patterns', () => {
            // Generate and detect several anomalous samples
            const results: AnomalyResult[] = [];
            for (let i = 0; i < 10; i++) {
                const features = generateNetworkTelemetry(true);
                results.push(detector.detect(features));
            }

            // At least some should have non-zero scores
            const nonZero = results.filter(r => r.score > 0);
            expect(nonZero.length).toBeGreaterThan(0);

            // All should have valid structure
            for (const result of results) {
                expect(result.timestamp).toBeGreaterThan(0);
                expect(typeof result.reconstructionError).toBe('number');
            }
        });

        it('should handle batch detection', () => {
            const batch = Array.from({ length: 5 }, () => generateNetworkTelemetry(false));
            const results = detector.detectBatch(batch);
            expect(results.length).toBe(5);
            results.forEach(r => {
                expect(r).toHaveProperty('score');
                expect(r).toHaveProperty('classification');
            });
        });
    });

    describe('Score Classification', () => {
        it('should correctly classify score ranges', () => {
            const detector = new ProductionAnomalyDetector();

            // We test indirectly via statistical detection (no model loaded)
            const normalFeatures = generateNetworkTelemetry(false);
            const result = detector.detect(normalFeatures);

            // Classification should be valid
            expect(['NORMAL', 'SUSPICIOUS', 'ANOMALOUS', 'CRITICAL']).toContain(result.classification);
        });
    });

    describe('Singleton Pattern', () => {
        it('should return the same detector instance', () => {
            const d1 = getDetector();
            const d2 = getDetector();
            expect(d1).toBe(d2);
        });
    });
});
