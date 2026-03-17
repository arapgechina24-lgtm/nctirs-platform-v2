/**
 * NCTIRS Anomaly Detection Engine — Powered by TensorFlow.js
 *
 * Implements a statistical anomaly detection model that runs entirely
 * in the browser. Uses an autoencoder-style approach:
 *   1. Learns "normal" network traffic patterns
 *   2. Computes reconstruction error for new data points
 *   3. High reconstruction error = anomaly
 *
 * Features analyzed:
 *   - Packet rate (packets/sec)
 *   - Byte volume (bytes/sec)
 *   - Unique destinations
 *   - Protocol distribution entropy
 *   - Time-of-day factor
 *   - Connection duration variance
 */

'use client';

import * as tf from '@tensorflow/tfjs';

// ===== Types =====

export interface NetworkFeatures {
    packetRate: number;        // packets per second
    byteVolume: number;        // bytes per second
    uniqueDestinations: number; // unique destination IPs
    protocolEntropy: number;    // Shannon entropy of protocol distribution
    timeOfDayFactor: number;    // 0–1 (0=midnight, 0.5=noon)
    connectionDuration: number; // avg connection duration in seconds
}

export interface AnomalyResult {
    score: number;                    // 0–100 (higher = more anomalous)
    isAnomaly: boolean;               // true if score > threshold
    confidence: number;               // 0–1
    reconstructionError: number;      // raw reconstruction error
    featureContributions: Record<keyof NetworkFeatures, number>;
    timestamp: number;
    classification: 'NORMAL' | 'SUSPICIOUS' | 'ANOMALOUS' | 'CRITICAL';
}

export interface ModelMetrics {
    isReady: boolean;
    trainingEpochs: number;
    trainingSamples: number;
    threshold: number;
    lastTrainedAt: number | null;
}

// ===== Constants =====

const FEATURE_NAMES: (keyof NetworkFeatures)[] = [
    'packetRate',
    'byteVolume',
    'uniqueDestinations',
    'protocolEntropy',
    'timeOfDayFactor',
    'connectionDuration',
];

const NUM_FEATURES = FEATURE_NAMES.length;
const ENCODING_DIM = 3;
const ANOMALY_THRESHOLD = 0.35;  // reconstruction error threshold
const MAX_SCORE = 100;

// Normal range for each feature (used for Z-score normalization)
const FEATURE_STATS: Record<keyof NetworkFeatures, { mean: number; std: number }> = {
    packetRate: { mean: 500, std: 200 },
    byteVolume: { mean: 50000, std: 20000 },
    uniqueDestinations: { mean: 25, std: 10 },
    protocolEntropy: { mean: 2.5, std: 0.8 },
    timeOfDayFactor: { mean: 0.5, std: 0.3 },
    connectionDuration: { mean: 30, std: 15 },
};

// ===== Anomaly Detector Class =====

export class AnomalyDetector {
    private encoder: tf.LayersModel | null = null;
    private decoder: tf.LayersModel | null = null;
    private autoencoder: tf.LayersModel | null = null;
    private metrics: ModelMetrics = {
        isReady: false,
        trainingEpochs: 0,
        trainingSamples: 0,
        threshold: ANOMALY_THRESHOLD,
        lastTrainedAt: null,
    };

    getMetrics(): ModelMetrics {
        return { ...this.metrics };
    }

    /**
     * Build the autoencoder model architecture.
     */
    private buildModel(): void {
        // Encoder
        const encoderInput = tf.input({ shape: [NUM_FEATURES] });
        const enc1 = tf.layers.dense({
            units: 8,
            activation: 'relu',
            kernelInitializer: 'glorotUniform',
        }).apply(encoderInput) as tf.SymbolicTensor;
        const enc2 = tf.layers.dense({
            units: ENCODING_DIM,
            activation: 'relu',
        }).apply(enc1) as tf.SymbolicTensor;

        this.encoder = tf.model({ inputs: encoderInput, outputs: enc2 });

        // Decoder
        const decoderInput = tf.input({ shape: [ENCODING_DIM] });
        const dec1 = tf.layers.dense({
            units: 8,
            activation: 'relu',
        }).apply(decoderInput) as tf.SymbolicTensor;
        const dec2 = tf.layers.dense({
            units: NUM_FEATURES,
            activation: 'linear',
        }).apply(dec1) as tf.SymbolicTensor;

        this.decoder = tf.model({ inputs: decoderInput, outputs: dec2 });

        // Autoencoder (end-to-end)
        const autoencoderOutput = this.decoder.apply(
            this.encoder.apply(encoderInput) as tf.SymbolicTensor
        ) as tf.SymbolicTensor;

        this.autoencoder = tf.model({ inputs: encoderInput, outputs: autoencoderOutput });
        this.autoencoder.compile({
            optimizer: tf.train.adam(0.01),
            loss: 'meanSquaredError',
        });
    }

    /**
     * Normalize features using Z-score normalization.
     */
    private normalize(features: NetworkFeatures): number[] {
        return FEATURE_NAMES.map(name => {
            const stat = FEATURE_STATS[name];
            return (features[name] - stat.mean) / (stat.std || 1);
        });
    }

    /**
     * Generate synthetic "normal" training data based on feature distributions.
     */
    private generateTrainingData(numSamples: number): tf.Tensor2D {
        const data: number[][] = [];

        for (let i = 0; i < numSamples; i++) {
            const sample = FEATURE_NAMES.map(name => {
                const stat = FEATURE_STATS[name];
                // Generate normally-distributed values around the mean
                const u1 = Math.random();
                const u2 = Math.random();
                const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                return (stat.mean + z * stat.std * 0.5 - stat.mean) / stat.std;
            });
            data.push(sample);
        }

        return tf.tensor2d(data);
    }

    /**
     * Train the autoencoder on "normal" data.
     */
    async train(epochs: number = 50, numSamples: number = 500): Promise<void> {
        this.buildModel();

        const trainData = this.generateTrainingData(numSamples);

        await this.autoencoder!.fit(trainData, trainData, {
            epochs,
            batchSize: 32,
            shuffle: true,
            verbose: 0,
        });

        trainData.dispose();

        this.metrics = {
            isReady: true,
            trainingEpochs: epochs,
            trainingSamples: numSamples,
            threshold: ANOMALY_THRESHOLD,
            lastTrainedAt: Date.now(),
        };
    }

    /**
     * Detect anomalies in a single data point.
     */
    detect(features: NetworkFeatures): AnomalyResult {
        if (!this.autoencoder || !this.metrics.isReady) {
            // Use statistical fallback if model isn't trained
            return this.statisticalDetect(features);
        }

        const normalized = this.normalize(features);
        const inputTensor = tf.tensor2d([normalized]);

        // Get reconstruction
        const outputTensor = this.autoencoder.predict(inputTensor) as tf.Tensor;
        const output = outputTensor.dataSync();

        // Calculate per-feature reconstruction error
        const featureErrors: Record<string, number> = {};
        let totalError = 0;

        FEATURE_NAMES.forEach((name, i) => {
            const error = Math.abs(normalized[i] - output[i]);
            featureErrors[name] = error;
            totalError += error * error;
        });

        const reconstructionError = Math.sqrt(totalError / NUM_FEATURES);

        // Cleanup tensors
        inputTensor.dispose();
        outputTensor.dispose();

        // Calculate anomaly score (0–100)
        const score = Math.min(MAX_SCORE, (reconstructionError / this.metrics.threshold) * 50);

        // Calculate feature contributions (normalized)
        const errorSum = Object.values(featureErrors).reduce((a, b) => a + b, 0) || 1;
        const featureContributions = {} as Record<keyof NetworkFeatures, number>;
        FEATURE_NAMES.forEach(name => {
            featureContributions[name] = featureErrors[name] / errorSum;
        });

        return {
            score: Math.round(score * 10) / 10,
            isAnomaly: reconstructionError > this.metrics.threshold,
            confidence: Math.min(0.99, 0.5 + reconstructionError * 0.5),
            reconstructionError,
            featureContributions,
            timestamp: Date.now(),
            classification: this.classifyScore(score),
        };
    }

    /**
     * Statistical fallback when the TF model isn't ready.
     * Uses Z-score based anomaly detection.
     */
    private statisticalDetect(features: NetworkFeatures): AnomalyResult {
        const zScores: Record<string, number> = {};
        let maxZ = 0;

        FEATURE_NAMES.forEach(name => {
            const stat = FEATURE_STATS[name];
            const z = Math.abs((features[name] - stat.mean) / (stat.std || 1));
            zScores[name] = z;
            maxZ = Math.max(maxZ, z);
        });

        const avgZ = Object.values(zScores).reduce((a, b) => a + b, 0) / NUM_FEATURES;
        const score = Math.min(MAX_SCORE, avgZ * 25);

        const zSum = Object.values(zScores).reduce((a, b) => a + b, 0) || 1;
        const featureContributions = {} as Record<keyof NetworkFeatures, number>;
        FEATURE_NAMES.forEach(name => {
            featureContributions[name] = zScores[name] / zSum;
        });

        return {
            score: Math.round(score * 10) / 10,
            isAnomaly: avgZ > 2.0,
            confidence: Math.min(0.8, 0.3 + avgZ * 0.15),
            reconstructionError: avgZ,
            featureContributions,
            timestamp: Date.now(),
            classification: this.classifyScore(score),
        };
    }

    /**
     * Classify an anomaly score into severity levels.
     */
    private classifyScore(score: number): AnomalyResult['classification'] {
        if (score >= 80) return 'CRITICAL';
        if (score >= 50) return 'ANOMALOUS';
        if (score >= 25) return 'SUSPICIOUS';
        return 'NORMAL';
    }

    /**
     * Dispose of all tensors and models to free memory.
     */
    dispose(): void {
        this.encoder?.dispose();
        this.decoder?.dispose();
        this.autoencoder?.dispose();
        this.encoder = null;
        this.decoder = null;
        this.autoencoder = null;
        this.metrics.isReady = false;
    }
}

// ===== Simulated Network Telemetry =====

/**
 * Generate realistic-looking network telemetry for the demo.
 * Occasionally injects anomalous patterns to test the detector.
 */
export function generateNetworkTelemetry(injectAnomaly: boolean = false): NetworkFeatures {
    const now = new Date();
    const hourOfDay = now.getHours() + now.getMinutes() / 60;
    const timeOfDayFactor = hourOfDay / 24;

    if (injectAnomaly) {
        // Generate anomalous traffic (random attack patterns)
        const attackType = Math.floor(Math.random() * 4);
        switch (attackType) {
            case 0: // DDoS — high packet rate, low entropy
                return {
                    packetRate: 5000 + Math.random() * 10000,
                    byteVolume: 500000 + Math.random() * 1000000,
                    uniqueDestinations: 2 + Math.floor(Math.random() * 3),
                    protocolEntropy: 0.2 + Math.random() * 0.3,
                    timeOfDayFactor,
                    connectionDuration: 1 + Math.random() * 3,
                };
            case 1: // Data exfiltration — high byte volume, few destinations
                return {
                    packetRate: 100 + Math.random() * 200,
                    byteVolume: 500000 + Math.random() * 2000000,
                    uniqueDestinations: 1 + Math.floor(Math.random() * 2),
                    protocolEntropy: 0.5 + Math.random() * 0.5,
                    timeOfDayFactor,
                    connectionDuration: 300 + Math.random() * 600,
                };
            case 2: // Port scanning — many destinations, low byte volume
                return {
                    packetRate: 2000 + Math.random() * 3000,
                    byteVolume: 5000 + Math.random() * 10000,
                    uniqueDestinations: 100 + Math.floor(Math.random() * 400),
                    protocolEntropy: 1.0 + Math.random() * 0.5,
                    timeOfDayFactor,
                    connectionDuration: 0.5 + Math.random() * 2,
                };
            case 3: // C2 beaconing — regular intervals, consistent size
                return {
                    packetRate: 10 + Math.random() * 20,
                    byteVolume: 1000 + Math.random() * 500,
                    uniqueDestinations: 1,
                    protocolEntropy: 0.1,
                    timeOfDayFactor,
                    connectionDuration: 5 + Math.random() * 2,
                };
            default:
                break;
        }
    }

    // Normal traffic with slight randomness
    const jitter = () => 0.8 + Math.random() * 0.4; // ±20% jitter

    return {
        packetRate: FEATURE_STATS.packetRate.mean * jitter(),
        byteVolume: FEATURE_STATS.byteVolume.mean * jitter(),
        uniqueDestinations: Math.floor(FEATURE_STATS.uniqueDestinations.mean * jitter()),
        protocolEntropy: FEATURE_STATS.protocolEntropy.mean * jitter(),
        timeOfDayFactor,
        connectionDuration: FEATURE_STATS.connectionDuration.mean * jitter(),
    };
}

// ===== Singleton for app-wide usage =====

let _detectorInstance: AnomalyDetector | null = null;

export function getDetector(): AnomalyDetector {
    if (!_detectorInstance) {
        _detectorInstance = new AnomalyDetector();
    }
    return _detectorInstance;
}
