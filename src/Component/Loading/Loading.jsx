import React from "react";
import { Box, keyframes } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

 const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 6px #42a5f5);
  }
  50% {
    transform: scale(1.2);
    filter: drop-shadow(0 0 6px #2196f3);
  }
`;

export default function Loading() {
  return (
    <Box
      sx={{
        height: "80vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
 
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
 
       <ShoppingCartIcon
        sx={{
          fontSize: 100,
          color: "#42a5f5",
          animation: `${pulse} 1.5s ease-in-out infinite`,
          zIndex: 2,
        }}
      />

   
    </Box>
  );
}
