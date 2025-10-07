import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {Box,Typography,Avatar,CircularProgress,Dialog,DialogTitle,DialogContent,IconButton,Button,TextField,Chip,Card,CardContent,Divider,Slider,useMediaQuery,} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";
import MessageIcon from "@mui/icons-material/Message";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import toast from "react-hot-toast";
import DeleteIcon from "@mui/icons-material/Delete";
import TuneIcon from "@mui/icons-material/Tune";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
 
export default function Home() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [hiddenProducts, setHiddenProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showOwnerDetails, setShowOwnerDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const { i18n } = useTranslation();
  const theme = useTheme();
  const [selectedImage, setSelectedImage] = useState(null);
  const isArabic = i18n.language === "ar";
  const navigate = useNavigate();

// Set the page title to "All Products" on initial load
useEffect(() => {
  document.title = t("allProduct");
}, []);

// Detect if the screen width is less than 900px (used for responsive layout)
const isSmallScreen = useMediaQuery("(max-width:900px)");

// Fetch all products and the user's cart items when the component mounts
useEffect(() => {
  const fetchAllProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        description,
        price,
        image_url,
        category,
        created_at,
        profiles!products_owner_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `
      )
      .order("id", { ascending: false });

    if (!error) {
      setProducts(data || []);
      setFilteredProducts(data || []);
    }

    setLoading(false);
  };

  const fetchCart = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: cartData } = await supabase
        .from("cart_items")
        .select("product_id")
        .eq("user_id", user.id);
      setCartItems(cartData?.map((item) => item.product_id) || []);
    }
  };

  fetchAllProducts();
  fetchCart();
}, []);

// Fetch the current logged-in user's ID
useEffect(() => {
  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };
  fetchUser();
}, []);

// Fetch comments related to the selected product whenever it changes
useEffect(() => {
  const fetchComments = async () => {
    if (!selectedProduct) return;
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        id,
        content,
        created_at,
        user_id,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `
      )
      .eq("product_id", selectedProduct.id)
      .order("created_at", { ascending: false });
    if (!error) setComments(data || []);
  };
  fetchComments();
}, [selectedProduct]);

// Filter products based on search query, category, price range, and hidden items
useEffect(() => {
  const shouldFilter =
    searchQuery.trim() !== "" ||
    categoryFilter.trim() !== "" ||
    priceRange[0] !== 0 ||
    priceRange[1] !== 10000 ||
    hiddenProducts.length > 0;

  if (!shouldFilter) {
    setFilteredProducts(products);
    return;
  }

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.price.toString().includes(searchQuery);

    const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    const matchesCategory = categoryFilter
      ? p.category === categoryFilter
      : true;
    const isVisible = !hiddenProducts.includes(p.id);

    return matchesSearch && matchesPrice && matchesCategory && isVisible;
  });

  setFilteredProducts(filtered);
}, [searchQuery, priceRange, categoryFilter, products, hiddenProducts]);

// Handle adding a new comment to the selected product
const handleAddComment = async () => {
  if (!commentText.trim()) return;
  setSending(true);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    setSending(false);
    return;
  }

  const { error } = await supabase.from("comments").insert({
    content: commentText.trim(),
    product_id: selectedProduct.id,
    user_id: user.id,
  });

  if (!error) {
    setCommentText("");
    const { data } = await supabase
      .from("comments")
      .select(
        `
        id,
        content,
        created_at,
        user_id,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `
      )
      .eq("product_id", selectedProduct.id)
      .order("created_at", { ascending: false });
    setComments(data || []);
  }

  setSending(false);
};

// Handle deleting a comment by its ID
const handleDeleteComment = async (commentId) => {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);
  if (!error) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }
};

// Handle adding a product to the user's cart
const handleAddToCart = async (product) => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return;

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", product.id)
    .single();
  if (existing) {
    toast(t("Theproductisalreadyinthecart"));
    return;
  }

  await supabase
    .from("cart_items")
    .insert({ user_id: user.id, product_id: product.id });
  setCartItems((prev) => [...prev, product.id]);
  toast.success(t("productAddedToCart", { name: product.name }));
};

// Hide a product from the filtered list by adding its ID to hiddenProducts
const handleHideProduct = (productId) => {
  setHiddenProducts((prev) => {
    const updated = [...prev, productId];
    const hidden = products.find((p) => p.id === productId);
    if (hidden) return updated;
  });
};

// Open the product modal and set the selected product
const openProductModal = (product) => setSelectedProduct(product);

// Close the product modal and reset related states
const closeProductModal = () => {
  setSelectedProduct(null);
  setComments([]);
  setCommentText("");
};

  if (loading)
    return (
      <Box textAlign="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", md: "row", overflow: "hidden" }}
      gap={4}
      p={3}
    >
      {/*Sidebar*/}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 4,
        }}
      >
        {/* Open the filters button on small screens*/}
        {isSmallScreen && !showFilters && (
          <IconButton
            onClick={() => setShowFilters(true)}
            sx={{
              position: "fixed",
              top: 80,
              [isArabic ? "right" : "left"]: 16,
              zIndex: 20,
              bgcolor: "#fff",
              boxShadow: 3,
              borderRadius: 2,
            }}
          >
            <TuneIcon sx={{ color: "#1976d2" }} />
          </IconButton>
        )}

        {/* Sidebar responsive */}
        {(showFilters || !isSmallScreen) && (
          <Box
            sx={{
              position: "fixed",
              top: { xs: 0, md: 24 },
              [isArabic ? "right" : "left"]: 0,
              width: { xs: "85%", sm: "90%", md: 290 },
              height: { xs: "100vh", md: "calc(100vh - 18px)" },
              overflowY: "auto",
              overflowX: "hidden",
              bgcolor: theme.palette.mode === "dark" ? "#2a2a2a" : "#f5f5f5",
              p: 4,
              borderRadius: { xs: 0, md: 3 },
              boxShadow: 4,
              zIndex: { xs: 1400, md: 0 },
            }}
          >
            {/*   Close filter button on small screens*/}
            {isSmallScreen && (
              <IconButton
                onClick={() => setShowFilters(false)}
                sx={{
                  position: "absolute",
                  top: 16,
                  [isArabic ? "left" : "right"]: 16,
                  bgcolor: theme.palette.mode === "dark" ? "#444" : "#f5f5f5",
                  color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  boxShadow: 2,
                }}
              >
                <CloseIcon />
              </IconButton>
            )}

            <Typography
              variant="h6"
              mb={3}
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: { xs: 4, md: 4 },
              }}
            >
              <TuneIcon sx={{ transform: "translateY(5px)", mr: 1 }} />
              {t("Filters")}
            </Typography>

            <TextField
              placeholder={t("Searcforproduct")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              size="small"
              sx={{
                mb: 3,
                "& .MuiInputBase-root": {
                  borderRadius: 2,
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#3a3a3a" : "#f7f7f7",
                  color: theme.palette.text.primary,
                  "&:hover": {
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 2px 6px rgba(255,255,255,0.1)"
                        : "0 2px 6px rgba(0,0,0,0.1)",
                  },
                  transition: "0.3s",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.divider,
                },
                "& .MuiInputBase-input": {
                  padding: "10px 9px",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
              }}
            />

            <Typography
              variant="body2"
              mb={1}
              sx={{ fontWeight: 500, color: theme.palette.text.secondary }}
            >
              {t("Pricefromto")}
            </Typography>

            <Box
              sx={{
                width: 210,
                mb: 3,
                direction: isArabic ? "rtl" : "ltr",  
                textAlign: isArabic ? "right" : "left",
              }}
            >
              <Slider
                value={priceRange}
                onChange={(e, newValue) => setPriceRange(newValue)}
                valueLabelDisplay="auto"
                min={0}
                max={10000}
                sx={{
                  color: theme.palette.primary.main,
                  "& .MuiSlider-thumb": {
                    "&:hover": {
                      boxShadow: `0 0 0 8px ${
                        theme.palette.mode === "dark"
                          ? "rgba(25,118,210,0.3)"
                          : "rgba(25,118,210,0.16)"
                      }`,
                    },
                  },
                }}
              />
            </Box>
            <TextField
              label={t("Classification")}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              fullWidth
              size="small"
              sx={{
                mb: 3,
                "& .MuiInputBase-root": {
                  borderRadius: 2,
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#3a3a3a" : "#f7f7f7",
                  color: theme.palette.text.primary,
                  "&:hover": {
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 2px 6px rgba(255,255,255,0.1)"
                        : "0 2px 6px rgba(0,0,0,0.1)",
                  },
                  transition: "0.3s",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.divider,
                },
                "& .MuiInputBase-input": {
                  padding: "10px 12px",
                },
              }}
            />

            <Button
              variant="outlined"
              fullWidth
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 600,
                color: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#263238" : "#f0f7ff",
                  borderColor: theme.palette.primary.dark,
                },
                transition: "0.3s",
              }}
              onClick={() => {
                setSearchQuery("");
                setPriceRange([0, 10000]);
                setCategoryFilter("");
              }}
            >
              {t("Resetfilters")}
            </Button>
          </Box>
        )}

      {/*Products */}
        <Box sx={{ flex: 1, [isArabic ? "mr" : "ml"]: { md: "250px" } }}>
      {/* Product Grid Here */}
        </Box>
      </Box>

      {/* Product display area*/}
      <Box flex={1}>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {t("Numberofproductsoffered")} {filteredProducts.length}
        </Typography>

        {filteredProducts.length === 0 && (
          <Typography> لا توجد منتجات</Typography>
        )}

        <Box
          display="grid"
          gridTemplateColumns={{
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(auto-fit, minmax(230px, 1fr))",
          }}
          gap={3}
        >
          {filteredProducts.map((p) => (
            <Box
              key={p.id}
              onMouseEnter={() => setHoveredProductId(p.id)}
              onMouseLeave={() => setHoveredProductId(null)}
              onClick={() => openProductModal(p)}
              sx={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                borderRadius: 1,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 8px 20px rgba(0,0,0,0.5)"
                    : "0 8px 20px rgba(0,0,0,0.1)",
                overflow: "hidden",
                bgcolor:
                  theme.palette.mode === "dark" ? "#2a2a2a" : "#edededff",
                color: theme.palette.text.primary,
                border: `1px solid ${theme.palette.divider}`,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                cursor: "pointer",
                maxWidth: { md: 390, xs: 435 },
                height: 450,
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 12px 24px rgba(0,0,0,0.7)"
                      : "0 12px 24px rgba(0,0,0,0.15)",
                },
              }}
            >
              {hoveredProductId === p.id && (
                <Box
                  position="absolute"
                  top={8}
                  sx={{
                    [isArabic ? "left" : "right"]: 8,
                    zIndex: 2,
                    display: "flex",
                    gap: 1,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(50,50,50,0.85)"
                        : "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(8px)",
                    borderRadius: 2,
                    p: 0.5,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 0 6px rgba(0,0,0,0.5)"
                        : 1,
                  }}
                >
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(p);
                    }}
                    sx={{
                      color: cartItems.includes(p.id)
                        ? theme.palette.success.main
                        : theme.palette.mode === "dark"
                        ? theme.palette.grey[300]
                        : theme.palette.text.primary,
                      "&:hover": {
                        bgcolor: theme.palette.action.hover,
                        transform: "scale(1.1)",
                        transition: "0.2s ease-in-out",
                      },
                    }}
                  >
                    <ShoppingCartIcon fontSize="medium" />
                  </IconButton>

                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHideProduct(p.id);
                    }}
                    sx={{
                      color:
                        theme.palette.mode === "dark"
                          ? theme.palette.grey[300]
                          : theme.palette.text.primary,
                      "&:hover": {
                        bgcolor: theme.palette.action.hover,
                        transform: "scale(1.1)",
                        transition: "0.2s ease-in-out",
                      },
                    }}
                  >
                    <VisibilityOffIcon fontSize="medium" />
                  </IconButton>
                </Box>
              )}

              <Box display="flex" alignItems="center" gap={1} p={1}>
                <Avatar
                  src={p.profiles?.avatar_url || "/default-avatar.png"}
                  sx={{
                    width: 28,
                    height: 28,
                    border: `2px solid ${theme.palette.background.paper}`,
                  }}
                />
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{ color: theme.palette.text.primary }}
                >
                  {p.profiles?.full_name || "—"}
                </Typography>
              </Box>

              <Box
                component="img"
                src={p.image_url}
                alt={p.name}
                sx={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 0,
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "inset 0 -1px 4px rgba(255,255,255,0.05)"
                      : "inset 0 -1px 4px rgba(0,0,0,0.05)",
                  transition: "transform 0.3s ease, filter 0.3s ease",
                  filter:
                    theme.palette.mode === "dark"
                      ? "brightness(0.9)"
                      : "brightness(0.97)",
                  "&:hover": {
                    transform: "scale(1.02)",
                    filter: "brightness(1.05)",
                  },
                }}
              />

              <Box
                p={2}
                display="flex"
                flexDirection="column"
                gap={1}
                flexGrow={1}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ color: theme.palette.text.primary }}
                >
                  {(() => {
                    const name =
                      typeof p.name === "string" ? p.name.trim() : "";
                    const words = name.split(/\s+/);
                    const maxWords = isSmallScreen ? 3 : 3; 
                    return words.length > maxWords
                      ? words.slice(0, maxWords).join(" ") + "..."
                      : name;
                  })()}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: 13,
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.description || "لا يوجد وصف"}
                </Typography>

                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{ color: theme.palette.primary.main }}
                >
                  {t("price")} : {p.price} {t("pound")}
                </Typography>

                <Box display="flex" gap={1} flexWrap="wrap">
                  {p.category && (
                    <Chip
                      label={p.category}
                      size="small"
                      sx={{
                        bgcolor:
                          theme.palette.mode === "dark" ? "#3a3a3a" : "#e3f2fd",
                        color:
                          theme.palette.mode === "dark" ? "#90caf9" : "#1976d2",
                        fontWeight: 500,
                      }}
                    />
                  )}
                  {p.created_at && (
                    <Chip
                      label={new Date(p.created_at).toLocaleDateString("ar-EG")}
                      size="small"
                      sx={{
                        bgcolor:
                          theme.palette.mode === "dark" ? "#2c2c2c" : "#f5f5f5",
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                      }}
                    />
                  )}
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: "auto",
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: 14,
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    "&:hover": {
                      bgcolor: theme.palette.primary.dark,
                    },
                    transition: "0.3s",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openProductModal(p);
                  }}
                >
                  {t("Viewdetails")}
                </Button>
              </Box>
            </Box>
          ))}
        </Box>

        {/*  Modal */}
        <Dialog
          open={!!selectedProduct}
          onClose={closeProductModal}
          fullWidth
          maxWidth="lg"
          PaperProps={{
            sx: {
              "@keyframes fadeInScale": {
                "0%": { opacity: 0, transform: "scale(0.95)" },
                "100%": { opacity: 1, transform: "scale(1)" },
              },
              animation: "fadeInScale 0.4s ease",
              borderRadius: 5,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 40px 80px rgba(0,0,0,0.7)"
                  : "0 40px 80px rgba(0,0,0,0.3)",
              backdropFilter: "blur(12px)",
              maxHeight: "95vh",
              display: "flex",
              flexDirection: "column",
              bgcolor: theme.palette.mode === "dark" ? "#070707ff" : "#f9f9f9",

              [theme.breakpoints.down("sm")]: {
                width: "100vw",
                height: "97vh",
                margin: 0,
                borderRadius: 0,
                maxHeight: "none",
              },
            },
          }}
        >
          {selectedProduct && (
            <>
              <IconButton
                onClick={closeProductModal}
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  bgcolor: theme.palette.mode === "dark" ? "#444" : "#fff",
                  color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  boxShadow: 2,
                  zIndex: 999999999,
                }}
              >
                <CloseIcon />
              </IconButton>

              {/*Content */}
              <DialogContent
                sx={{
                  px: 0,
                  py: 0,
                  flex: 1,
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  overflow: "hidden",
                }}
              >
                {/*Product side */}
                <Box
                  flex={1}
                  px={2}
                  py={2}
                  sx={{
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    <Box
                      onClick={() =>
                        setSelectedImage(selectedProduct.image_url)
                      }
                      sx={{
                        width: "100%",
                        height: { xs: 220, md: 420 },
                        borderRadius: 4,
                        mb: 2,
                        overflow: "hidden",
                        boxShadow:
                          theme.palette.mode === "dark"
                            ? "0 4px 12px rgba(255,255,255,0.1)"
                            : "0 4px 12px rgba(0,0,0,0.1)",
                        transition: "transform 0.4s ease",
                        "&:hover img": {
                          transform: "scale(1.02)",
                        },
                         "&:hover .viewBox": {
                          opacity: 1,
                          zIndex: 999,
                        },
                      }}
                    >
                      <Box
                        component="img"
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.4s ease",
                        }}
                      />
                      <Box
                        className="viewBox"
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          borderRadius: 4,
                          bgcolor: "rgba(0,0,0,0.5)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          fontWeight: "bold",
                          opacity: 0,
                          transition: "opacity 0.3s ease",
                          zIndex: 0,
                        }}
                      >
                      {t('Viewtheimage')} <CenterFocusStrongIcon sx={{mx:1}}></CenterFocusStrongIcon>

                      </Box>
                    </Box>
                  </Box>

                  {/* show full image */}
                  <Dialog
                    open={Boolean(selectedImage)}
                    onClose={() => setSelectedImage(null)}
                    fullScreen
                    PaperProps={{
                      sx: {
                        bgcolor: "rgba(0,0,0,0.95)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        p: 0,
                      },
                    }}
                  >
                    <IconButton
                      onClick={() => setSelectedImage(null)}
                      sx={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        color: "#fff",
                        zIndex: 10,
                      }}
                    >
                      <CloseIcon />
                    </IconButton>

                    <Box
                      component="img"
                      src={selectedImage}
                      alt="show image"
                      sx={{
                        width: {
                          xs: "100%",
                          sm: "90%",
                          md: "80%",
                          lg: "70%",
                        },
                        maxHeight: {
                          xs: "80vh",
                          sm: "85vh",
                          md: "90vh",
                        },
                        objectFit: "contain",
                        borderRadius: 2,
                        boxShadow: "0 0 20px rgba(0,0,0,0.5)",
                        transition: "all 0.3s ease-in-out",
                      }}
                    />
                  </Dialog>

                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {selectedProduct.name}
                  </Typography>

                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {t("price")} : {selectedProduct.price} {t("pound")}
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.8,
                    }}
                  >
                    {selectedProduct.description || "no discription"}
                  </Typography>

                 {/*   Buttons on small screens */}
                  {isSmallScreen && (
                    <Box display="flex" flexDirection="column" gap={2} mt={2}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={
                          <MessageIcon sx={{ ml: isArabic ? 1.5 : 0 }} />
                        }
                        sx={{ borderRadius: 2 }}
                        onClick={() => setShowOwnerDetails(true)}
                      >
                        {t("Communicatewiththeproductowner")}
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        startIcon={
                          <ShoppingCartIcon sx={{ ml: isArabic ? 1.5 : 0 }} />
                        }
                        sx={{ borderRadius: 3 }}
                        onClick={() => handleAddToCart(selectedProduct)}
                      >
                        {t("Addtocart")}
                      </Button>
                    </Box>
                  )}

                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    mt={2}
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <MessageIcon sx={{ fontSize: 16 }} /> {t("Comments")}
                  </Typography>

                  {comments.length === 0 ? (
                    <Typography color="text.secondary">
                      {t("Therearenocommentsyet")}
                    </Typography>
                  ) : (
                    <Box display="flex" flexDirection="column" gap={2}>
                      {comments.map((c) => (
                        <Card
                          key={c.id}
                          elevation={1}
                          sx={{
                            borderRadius: 3,
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? "#191919ff"
                                : "#edededff",
                            color: theme.palette.text.primary,
                            padding: 1,  
                            [theme.breakpoints.down("sm")]: {
                              padding: 1, 
                              gap: 1.5,  
                            },
                          }}
                        >
                          <CardContent
                            sx={{
                              display: "flex",
                              gap: 2,
                              padding: 1,  
                              [theme.breakpoints.down("sm")]: {
                                padding: 0,  
                                gap: 1.5, 
                              },
                            }}
                          >
                            <Avatar
                              src={
                                c.profiles?.avatar_url || "/default-avatar.png"
                              }
                              sx={{ width: 48, height: 48 }}
                            />
                            <Box flex={1}>
                              <Typography variant="body1" fontWeight="bold">
                                {c.profiles?.full_name || "—"}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                              >
                                {c.content}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.disabled"
                                sx={{ mt: 0.5, display: "block" }}
                              >
                                {new Date(c.created_at).toLocaleString()}
                              </Typography>
                            </Box>
                            {currentUserId === c.user_id && (
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteComment(c.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Product Owner's Side (For Large Screens Only) */}
                <Box
                  width={{ xs: "100%", md: 300 }}
                  display={{ xs: "none", md: "flex" }}
                  bgcolor={
                    theme.palette.mode === "dark" ? "#2c2c2c" : "#f9f9f9"
                  }
                  borderLeft={{ md: `1px solid ${theme.palette.divider}` }}
                  px={3}
                  py={4}
                  flexDirection="column"
                  alignItems="center"
                  gap={2}
                  sx={{
                    flex: "none",
                    alignSelf: "stretch",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "-4px 0 12px rgba(255,255,255,0.05)"
                        : "-4px 0 12px rgba(0,0,0,0.05)",
                  }}
                >
                  <Avatar onClick={() =>
                      navigate(
                        `/profiledetails/${selectedProduct.profiles?.id}`
                      )
                    }
                    src={
                      selectedProduct.profiles?.avatar_url ||
                      "/default-avatar.png"
                    }
                    sx={{
                      width: 80,
                      height: 80,
                      border: `2px solid ${theme.palette.background.paper}`,
                      cursor:'pointer'
                    }}
                  />
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {selectedProduct.profiles?.full_name || "—"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("Productowner")}
                  </Typography>

                  <Divider sx={{ width: "100%", my: 2 }} />

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<MessageIcon sx={{ ml: isArabic ? 1.5 : 0 }} />}
                    sx={{ borderRadius: 3 }}
                    onClick={() =>
                      navigate(`/message/${selectedProduct.profiles?.id}`, {
                        state: { product: selectedProduct },
                      })
                    }
                  >
                    {t("communication")}
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    color="secondary"
                    startIcon={<PersonIcon sx={{ ml: isArabic ? 1.5 : 0 }} />}
                    sx={{ borderRadius: 3 }}
                    onClick={() =>
                      navigate(
                        `/profiledetails/${selectedProduct.profiles?.id}`
                      )
                    }
                  >
                    {t("Profile")}
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    color="success"
                    startIcon={
                      <ShoppingCartIcon sx={{ ml: isArabic ? 1.5 : 0 }} />
                    }
                    sx={{ borderRadius: 3 }}
                    onClick={() => handleAddToCart(selectedProduct)}
                  >
                    {t("Addtocart")}
                  </Button>
                </Box>
              </DialogContent>

              {/*Comment Entry */}
              <Box
                sx={{
                  px: 2,
                  py: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  bgcolor:
                    theme.palette.mode === "dark" ? "#2c2c2c" : "#f9f9f9",
                }}
              >
                <Box
                  display="flex"
                  flexDirection="row"
                  gap={1}
                  flexWrap={{ xs: "wrap", sm: "nowrap" }}
                  alignItems="flex-start"
                >
                  <TextField
                    fullWidth
                    multiline
                    rows={1}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t("Writeyourcommenthere")}
                    sx={{
                      flex: 1,
                      borderRadius: 3,
                      "& .MuiInputBase-root": {
                        borderRadius: 3,
                        boxShadow:
                          theme.palette.mode === "dark"
                            ? "0 1px 4px rgba(255,255,255,0.1)"
                            : "0 1px 4px rgba(0,0,0,0.1)",
                        padding: 1,
                        backgroundColor:
                          theme.palette.mode === "dark" ? "#3a3a3a" : "#fff",
                        color: theme.palette.text.primary,
                      },
                      "& .MuiInputBase-input": { fontSize: 14 },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.divider,
                      },
                    }}
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    sx={{
                      minWidth: { sm: 20, md: 100 },
                      height: 40,
                      borderRadius: 3,
                      alignSelf: "center",
                      whiteSpace: "nowrap",
                    }}
                    disabled={sending || !commentText.trim()}
                    onClick={handleAddComment}
                  >
                    {t("send")}
                  </Button>
                </Box>
              </Box>

              {/* Small Dialog for the product owner on small screens */}
              <Dialog
                open={showOwnerDetails}
                onClose={() => setShowOwnerDetails(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{
                  sx: {
                    borderRadius: 4,
                    p: 3,
                    bgcolor:
                      theme.palette.mode === "dark" ? "#2c2c2c" : "#f9f9f9",
                    color: theme.palette.text.primary,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 20px 40px rgba(0,0,0,0.6)"
                        : "0 20px 40px rgba(0,0,0,0.2)",
                  },
                }}
              >
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={2}
                >
                  <Avatar
                    src={
                      selectedProduct.profiles?.avatar_url ||
                      "/default-avatar.png"
                    }
                    sx={{
                      width: 72,
                      height: 72,
                      border: `2px solid ${theme.palette.background.paper}`,
                    }}
                  />
                  <Typography variant="body1" fontWeight="bold">
                    {selectedProduct.profiles?.full_name || "—"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("Productowner")}
                  </Typography>

                  <Divider sx={{ width: "100%", my: 2 }} />

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<MessageIcon sx={{ ml: isArabic ? 1.5 : 0 }} />}
                    sx={{ borderRadius: 3 }}
                    onClick={() =>
                      navigate(`/message/${selectedProduct.profiles?.id}`, {
                        state: { product: selectedProduct },
                      })
                    }
                  >
                    {t("communication")}
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    color="secondary"
                    startIcon={<PersonIcon sx={{ ml: isArabic ? 1.5 : 0 }} />}
                    sx={{ borderRadius: 3 }}
                    onClick={() =>
                      navigate(
                        `/profiledetails/${selectedProduct.profiles?.id}`
                      )
                    }
                  >
                    {t("Profile")}
                  </Button>
                </Box>
              </Dialog>
            </>
          )}
        </Dialog>
      </Box>
    </Box>
  );
}
