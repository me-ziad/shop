import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import {Box,Typography,Avatar,IconButton,Button,TextField,Chip,Slider,useMediaQuery,} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import toast from "react-hot-toast";
import TuneIcon from "@mui/icons-material/Tune";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import Loading from "../Loading/Loading";

export default function Home() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [hiddenProducts, setHiddenProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const { i18n } = useTranslation();
  const theme = useTheme();
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
  // const openProductModal = (product) => setSelectedProduct(product);
  const openProductModal = (product) => {
    navigate(`/product/${product.id}`);
  };

  if (loading)
    return (
      <Box textAlign="center" mt={5}>
        <Loading></Loading>
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
            md: "repeat(auto-fit, minmax(260px, 1fr))",
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
                    : "0 8px 50px rgba(0,0,0,0.1)",
                overflow: "hidden",
                bgcolor:
                  theme.palette.mode === "dark" ? "#2a2a2a" : "#edededff",
                color: theme.palette.text.primary,
                // border: `1px solid ${theme.palette.divider}`,
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
      </Box>
    </Box>
  );
}
