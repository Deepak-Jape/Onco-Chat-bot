import React from 'react';
import { Box, Typography } from "@mui/material";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

/**
 * Reusable Score Indicator Component
 * @param {number} score - The numerical value (0-100)
 * @param {number} size - The width/height of the circle in pixels
 * @param {boolean} showText - Whether to show the number next to the circle
 */
const ScoreIndicator = ({ score, size = 16, showText = true }) => {
    
    // Logic to match the color branding from the design images
    const getScoreColor = (val) => {
        const num = parseInt(val);
        if (num >= 80) return "#27AE60"; // Green
        if (num >= 70) return "#A65F00"; // Darker Orange/Tan from Cohort table
        if (num >= 50) return "#F18010"; // Standard Orange
        return "#F15757"; // Red
    };

    const color = getScoreColor(score);

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Box sx={{ width: size, height: size }}>
                <CircularProgressbar
                    value={score}
                    strokeWidth={14}
                    styles={buildStyles({
                        pathColor: color,
                        trailColor: "#E0E0E0",
                        strokeLinecap: "round",
                    })}
                />
            </Box>
            {showText && (
                <Typography 
                    sx={{ 
                        fontFamily: "'Rubik', sans-serif", 
                        fontSize: "14px", 
                        fontWeight: 500, 
                        color: "#00000099" 
                    }}
                >
                    {score}
                </Typography>
            )}
        </Box>
    );
};

export default ScoreIndicator;