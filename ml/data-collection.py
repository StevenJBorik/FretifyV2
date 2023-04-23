import os
import pandas as pd
import numpy as np
import librosa

# Set the path to the Million Song Subset data directory
data_dir = "/millionsogsubset.tar"

# Load the track metadata
metadata = pd.read_csv(os.path.join(data_dir, "AdditionalFiles", "subset_track_metadata.csv"))

# Iterate over each track and extract audio features
for i, row in metadata.iterrows():
    # Get the path to the audio file
    file_path = os.path.join(data_dir, "data", row["artist_id"], row["release"], row["track_id"] + ".mp3")

    # Load the audio data
    y, sr = librosa.load(file_path, sr=None)

    # Extract the audio features
    chroma_stft = librosa.feature.chroma_stft(y=y, sr=sr)
    rmse = librosa.feature.rmse(y=y)
    spec_cent = librosa.feature.spectral_centroid(y=y, sr=sr)
    spec_bw = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
    zcr = librosa.feature.zero_crossing_rate(y)

    # Save the audio features and corresponding scale/mode
    # and guitar position (if available) to a CSV file
    # You'll need to label the data manually or obtain labels from an existing dataset
    # Here's an example of how to save the data to a CSV file:
    df = pd.DataFrame({
        "chroma_stft": [chroma_stft],
        "rmse": [rmse],
        "spec_cent": [spec_cent],
        "spec_bw": [spec_bw],
        "rolloff": [rolloff],
        "zcr": [zcr],
        "scale_mode": ["C Major"],
        "guitar_position": ["open"]
    })
    df.to_csv("data.csv", mode="a", index=False, header=not os.path.exists("data.csv"))
