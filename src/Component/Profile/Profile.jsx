import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import {Box,Typography,Avatar,Button,Tabs,Tab,CircularProgress,Dialog,DialogTitle,DialogContent,DialogActions,TextField,IconButton,Tooltip,useTheme,DialogContentText,Card,CardContent,} from "@mui/material";
import {Edit,Add,EditOutlined,DeleteOutline,ChatBubbleOutline,Send,} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { motion } from "framer-motion";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import Loading from "../Loading/Loading";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentsMap, setCommentsMap] = useState({});
  const [commentText, setCommentText] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [commentsModalProduct, setCommentsModalProduct] = useState(null);
  const [editData, setEditData] = useState({
    full_name: "",
    phone: "",
    address: "",
    avatar_url: "",
  });
  const [editValues, setEditValues] = useState({
    name: "",
    description: "",
    price: "",
  });
  const theme = useTheme();
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);

  // Set the page title to "Profile" when the component mounts
  useEffect(() => {
    document.title = t("profile");
  }, []);

  // Fetch the current authenticated user's ID
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    fetchUser();
  }, []);

  // Delete a comment by its ID and update the local comments state
  const handleDeleteComment = async (commentId) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } else {
      console.error("خطأ في حذف التعليق:", error);
    }
  };

  // Fetch all comments and group them by product ID
  useEffect(() => {
    const fetchCommentsForAll = async () => {
      const { data, error } = await supabase.from("comments").select(`
      id,
      content,
      created_at,
      product_id,
      user_id,
      profiles (
        full_name,
        avatar_url
      )
    `);

      if (!error && data) {
        const grouped = data.reduce((acc, comment) => {
          acc[comment.product_id] = acc[comment.product_id] || [];
          acc[comment.product_id].push(comment);
          return acc;
        }, {});
        setCommentsMap(grouped);
      }
    };

    fetchCommentsForAll();
  }, [products]);

  // Fetch profile data and products for the current user
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return navigate("/signin");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const { data: userProducts } = await supabase
        .from("products")
        .select("*")
        .eq("owner_id", user.id);

      setProfile(profileData);
      setProducts(userProducts || []);
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  // When switching to the edit tab, populate the edit form with profile data
  useEffect(() => {
    if (tabIndex === 1 && profile) {
      setEditData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        avatar_url: profile.avatar_url || "",
      });
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [tabIndex, profile]);

  // Handle tab change in the profile view
  const handleTabChange = (e, newValue) => {
    setTabIndex(newValue);
  };

  // Save edited profile data, including optional avatar upload
  const handleSaveEdit = async () => {
    if (!editData.full_name || !editData.phone || !editData.address) {
      toast.error(t("Allfieldsarerequired"));
      return;
    }

    let avatarUrl = editData.avatar_url;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const fileName = `${profile.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile, { upsert: true });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editData.full_name,
        phone: editData.phone,
        address: editData.address,
        avatar_url: avatarUrl,
      })
      .eq("id", profile.id);

    if (!error) {
      setProfile((prev) => ({
        ...prev,
        ...editData,
        avatar_url: avatarUrl,
      }));
      toast.success(t("Yourdatahasbeenmodifiedsuccessfully"));
    } else {
      toast.error(t("Datamodificationfailed"));
    }
  };

  // Add a new comment to the selected product in the modal
  const handleAddComment = async () => {
    if (!commentText.trim() || !commentsModalProduct) return;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log("خطأ في جلب المستخدم:", userError);
      return;
    }

    const { error: insertError } = await supabase.from("comments").insert({
      content: commentText.trim(),
      product_id: commentsModalProduct.id,
      user_id: user.id,
    });

    if (insertError) {
      console.log("خطأ في إضافة التعليق:", insertError);
      return;
    }

    const { data: updatedComments, error: fetchError } = await supabase
      .from("comments")
      .select(
        `
    id,
    content,
    created_at,
    user_id,
    profiles (
      full_name,
      avatar_url
    )
  `
      )
      .eq("product_id", commentsModalProduct.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.log("خطأ في تحميل التعليقات:", fetchError);
      return;
    }

    setComments(updatedComments || []);
    setCommentText("");
  };

  // Open the product edit modal and populate it with existing product data
  const openEditModalFromProduct = (product) => {
    setSelectedProduct(product);
    setEditValues({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
    });
    setNewImageFile(null);
    setNewImagePreview(null);
  };

  // Save edited product data, including optional image upload
  const handleSaveProductEdit = async () => {
    let imageUrl = selectedProduct.image_url;

    if (newImageFile) {
      const ext = newImageFile.name.split(".").pop();
      const fileName = `${selectedProduct.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, newImageFile, {
          cacheControl: "3600",
          upsert: true,
          contentType: newImageFile.type,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        imageUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      }
    }

    const { error } = await supabase
      .from("products")
      .update({
        name: editValues.name,
        description: editValues.description,
        price: parseFloat(editValues.price),
        image_url: imageUrl,
      })
      .eq("id", selectedProduct.id);

    if (!error) {
      toast.success(t("Theproducthasbeenmodifiedsuccessfully"));
      setSelectedProduct(null);
      const updated = products.map((p) =>
        p.id === selectedProduct.id
          ? {
              ...p,
              ...editValues,
              price: parseFloat(editValues.price),
              image_url: imageUrl,
            }
          : p
      );
      setProducts(updated);
    } else {
      toast.error(t("Productmodificationailed"));
    }
  };

  // Open the comments modal for a specific product and fetch its comments
  const openCommentsModal = async (product) => {
    setCommentsModalProduct(product);
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
    id,
    content,
    created_at,
    user_id,
    profiles (
      full_name,
      avatar_url
    )
  `
      )
      .eq("product_id", product.id)
      .order("created_at", { ascending: false });

    if (!error) setComments(data || []);
  };

  // Delete a product by its ID and update the local products state
  const handleDelete = async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (!error) {
      toast.success(t("Theproducthasbeensuccessfullydeleted"));
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } else {
      toast.error("فشل حذف المنتج");
    }
  };
  if (loading)
    return (
      <Box textAlign="center" mt={5}>
        <Loading></Loading>
      </Box>
    );
  if (!profile) return null;
  return (
    <Box p={3}>
      <Toaster position="top-center" reverseOrder={false} />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box textAlign="center" mb={3}>
          <Avatar
            src={profile.avatar_url || "/default-avatar.png"}
            sx={{ width: 120, height: 120, margin: "auto" }}
          />
          <Typography variant="h5" mt={2}>
            {profile.full_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profile.address || "—"}
          </Typography>
          <Box mt={2} display="flex" justifyContent="center" gap={2}>
            <Button
              sx={{ fontSize: { xs: "10px", md: "14px" } }}
              variant="outlined"
              startIcon={<Edit sx={isArabic ? { ml: 1 } : { mr: 0 }} />}
              onClick={() => setTabIndex(1)}
            >
              {t("Editprofile")}
            </Button>
            <Button
              sx={{ fontSize: { xs: "10px", md: "14px" } }}
              variant="contained"
              startIcon={<Add sx={isArabic ? { ml: 1 } : { mr: 0 }} />}
              onClick={() => navigate("/AddProduct")}
            >
              {t("Addproduc")}
            </Button>
          </Box>
        </Box>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          centered
          sx={{
            mb: 3,
            "& .MuiTab-root": {
              fontWeight: "bold",
              fontSize: "16px",
              transition: "0.3s",
            },
            "& .Mui-selected": { color: "#1976d2" },
            "& .MuiTabs-indicator": {
              height: "4px",
              borderRadius: "2px",
              backgroundColor: "#1976d2",
            },
          }}
        >
          <Tab label={t("PortWorks")} />
          <Tab label={t("Modifydata")} />
        </Tabs>
      </motion.div>

      {/*Product cards */}
      {tabIndex === 0 && (
        <Box>
          <Typography variant="h6" mb={2}>
            {t("PortWorks")} :
          </Typography>

          {products.length === 0 ? (
            <Box textAlign="center" py={5}>
              <Typography variant="h6" color="text.secondary">
                {t("NoProductsAvailable") || "لا توجد منتجات حالياً"}
              </Typography>
            </Box>
          ) : (
            <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={3}>
              {products.map((product) => (
                <Box
                  key={product.id}
                  sx={{
                    borderRadius: 1,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 8px 20px rgba(0,0,0,0.5)"
                        : "0 8px 20px rgba(0,0,0,0.1)",
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: "hidden",
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#202020ff" : "#edededff",
                    position: "relative",
                    transition: "0.3s",
                    height: 450,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "start",
                    "&:hover": {
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 12px 30px rgba(0,0,0,0.7)"
                          : "0 12px 30px rgba(0,0,0,0.15)",
                      transform: "translateY(-5px)",
                    },
                  }}
                >
                  {/* Product Image */}
                  {product.image_url && (
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        height: 220,
                        cursor: "pointer",
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        "&:hover .overlay": {
                          opacity: 1,
                        },
                      }}
                      onClick={() => setSelectedImage(product.image_url)}
                    >
                      <Box
                        component="img"
                        src={product.image_url}
                        alt={product.name}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.3s ease",
                          "&:hover": {
                            transform: "scale(1.02)",
                          },
                        }}
                      />

                      <Box
                        className="overlay"
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          bgcolor: "rgba(0,0,0,0.3)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: "bold",
                          opacity: 0,
                          transition: "opacity 0.3s ease",
                          zIndex: 2,
                          pointerEvents: "none",
                        }}
                      >
                        {t("Clicktoviewtheimage")}{" "}
                        <CenterFocusStrongIcon
                          sx={{ mx: 1 }}
                        ></CenterFocusStrongIcon>
                      </Box>
                    </Box>
                  )}

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
                      alt="عرض الصورة"
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

                  {/* Edit and delete icons */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      display: "flex",
                      gap: 1,
                    }}
                  >
                    <Tooltip title="تعديل">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => openEditModalFromProduct(product)}
                        sx={{
                          bgcolor:
                            theme.palette.mode === "dark" ? "#444" : "#f5f5f5",
                          "&:hover": {
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? "#1976d2"
                                : "#e3f2fd",
                          },
                        }}
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="حذف">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(product.id)}
                        sx={{
                          bgcolor:
                            theme.palette.mode === "dark" ? "#444" : "#f5f5f5",
                          "&:hover": {
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? "#d32f2f"
                                : "#ffebee",
                          },
                        }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Product Data */}
                  <Box
                    px={2}
                    py={2}
                    display="flex"
                    flexDirection="column"
                    gap={1}
                    sx={{ flexGrow: 1 }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{
                        color: theme.palette.text.primary,
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {product.name}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        backgroundColor:
                          theme.palette.mode === "dark" ? "#2a2a2a" : "#f9f9f9",
                        p: 1.5,
                        borderRadius: 2,
                        fontSize: 14,
                        lineHeight: 1.6,
                        boxShadow:
                          theme.palette.mode === "dark"
                            ? "inset 0 1px 3px rgba(255,255,255,0.05)"
                            : "inset 0 1px 3px rgba(0,0,0,0.05)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {product.description || "لا يوجد وصف"}
                    </Typography>

                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{
                        color: theme.palette.primary.main,
                        fontSize: 16,
                      }}
                    >
                      {t("price")}: {product.price} {t("pound")}
                    </Typography>
                  </Box>

                  {/* The comments icon is fixed at the end of the card */}
                  <Box display="flex" justifyContent="center" pb={2}>
                    <Tooltip title="عرض التعليقات">
                      <IconButton
                        onClick={() => openCommentsModal(product)}
                        sx={{
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "#3a3a3a"
                              : "#f5f5f5",
                          "&:hover": {
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? "#555"
                                : "#e0f7fa",
                          },
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          boxShadow: 1,
                        }}
                      >
                        <ChatBubbleOutline
                          sx={{
                            fontSize: 20,
                            color: theme.palette.primary.main,
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
      <Dialog
        open={!!commentsModalProduct}
        onClose={() => setCommentsModalProduct(null)}
        fullWidth={false}
        maxWidth={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            width: { xs: "100%", md: "90%" },
            height: { xs: "95vh", md: "90vh" },
            display: "flex",
            flexDirection: "column",
            position: "relative",
            bgcolor: theme.palette.background.paper,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 20px 40px rgba(0,0,0,0.6)"
                : 10,
            overflow: "hidden",
          },
        }}
      >
        {commentsModalProduct && (
          <>
            {/* Close Button */}
            <IconButton
              onClick={() => setCommentsModalProduct(null)}
              sx={{
                position: "absolute",
                top: 12,
                ...(isArabic ? { left: 30 } : { right: 20 }),
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "#444"
                    : "rgba(255,255,255,0.8)",
                color: theme.palette.text.primary,
                zIndex: 10,
                boxShadow: 1,
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Main Content */}
            <Box
              sx={{
                display: "flex",
                flex: 1,
                flexDirection: {
                  xs: "column",
                  md: isArabic ? "row" : "row-reverse",
                },
                overflow: "hidden",
              }}
            >
              {/* Product Image */}
              <Box
                sx={{
                  flex: { xs: "unset", md: 1 },
                  p: 2,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative",
                  cursor: "pointer",
                  "&:hover .overlay": { opacity: 1 },
                  maxHeight: { xs: "30%", md: "100%" },
                }}
                onClick={() => setSelectedImage(commentsModalProduct.image_url)}
              >
                <Box
                  component="img"
                  src={commentsModalProduct.image_url}
                  alt={commentsModalProduct.name}
                  sx={{
                    width: "100%",
                    height: { xs: 200, md: "100%" },
                    objectFit: "cover",
                    borderRadius: 2,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 4px 12px rgba(255,255,255,0.1)"
                        : "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Box
                  className="overlay"
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    bgcolor: "rgba(0,0,0,0.3)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: "bold",
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                    zIndex: 2,
                  }}
                >
                  {t("Clicktoviewtheimage")}
                </Box>
              </Box>

              {/* Comments Section */}
                            <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      borderLeft: isArabic
                        ? "none"
                        : `1px solid ${theme.palette.divider}`,
                      borderRight: isArabic
                        ? `1px solid ${theme.palette.divider}`
                        : "none",
                      bgcolor: theme.palette.mode === "dark" ? "#2a2a2a" : "#fafafa",
                      overflowY: "auto",
                      maxHeight: "100vh",

                      /* ==== Scrollbar Styles ==== */
                      "&::-webkit-scrollbar": {
                        width: "8px", 
                      },
                      "&::-webkit-scrollbar-track": {
                        background: theme.palette.mode === "dark" ? "#1f1f1f" : "#f0f0f0",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: theme.palette.mode === "dark" ? "#555" : "#aaa",
                        borderRadius: "4px",
                        border: "2px solid transparent",
                        backgroundClip: "content-box",
                      },
                      "&::-webkit-scrollbar-thumb:hover": {
                        backgroundColor: theme.palette.mode === "dark" ? "#777" : "#888",
                      },
                    }}
                  >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ px: 3, py: 2, textAlign: isArabic ? "right" : "left" }}
                >
                  {t("Commentson")} : {commentsModalProduct.name}
                </Typography>

                <Box
                  sx={{
                    px: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {comments.length === 0 ? (
                    <Typography sx={{ color: theme.palette.text.secondary }}>
                      {t("Therearenocommentsyet")}
                    </Typography>
                  ) : (
                    [...comments]
                      .sort(
                        (a, b) =>
                          new Date(b.created_at) - new Date(a.created_at)
                      )
                      .map((c) => (
                        <Card
                          key={c.id}
                          elevation={0}
                          sx={{
                             bgcolor:
                              theme.palette.mode === "dark"?  'transparent': 'transparent',
                            px: 2,
                            py: 1,
                            display: "flex",
                            flexDirection: isArabic ? "row" : "row-reverse",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            borderBottom: theme.palette.mode === "dark" ? '2px solid #ffffff22' : '2px solid #2222',
                          }}
                        >
                          <IconButton sx={{ order: isArabic ? 1 : 3 }}>
                            <Avatar
                              src={
                                c.profiles?.avatar_url || "/default-avatar.png"
                              }
                            />
                          </IconButton>

                          <Box
                            flex={1}
                            sx={{
                              textAlign: isArabic ? "right" : "left",
                              order: 2,
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              sx={{
                                cursor: "pointer",
                                color: theme.palette.text.primary,
                              }}
                            >
                              {c.profiles?.full_name || "—"}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: theme.palette.text.secondary,
                                fontSize: 13,
                              }}
                            >
                              {c.content}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: theme.palette.text.disabled,
                                fontSize: 11,
                              }}
                            >
                              {new Date(c.created_at).toLocaleString(
                                document.dir === "rtl" ? "ar-EG" : "en-US"
                              )}
                            </Typography>
                          </Box>

                          {currentUserId === c.user_id && (
                            <IconButton
                              onClick={() => handleDeleteComment(c.id)}
                              sx={{ order: isArabic ? 3 : 1 }}
                            >
                              <DeleteIcon fontSize="small" color="error" />
                            </IconButton>
                          )}
                        </Card>
                      ))
                  )}
                </Box>
              </Box>
            </Box>

            {/* Comment Input */}
            <Box
              sx={{
                px: { xs: 1, md: 3 },
                py: { xs: 1, md: 3 },
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.mode === "dark" ? "#3a3a3a" : "#fff",
              }}
            >
              <Box
                display="flex"
                gap={2}
                flexDirection={document.dir === "rtl" ? "row" : "row-reverse"}
              >
                <TextField
                  fullWidth
                  multiline
                  rows={1}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t("Writeyourcomment")}
                  sx={{
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
                  startIcon={<Send sx={{ mx: 1 }} />}
                  sx={{
                    height: "fit-content",
                    alignSelf: "flex-start",
                    borderRadius: 3,
                  }}
                  disabled={!commentText.trim()}
                  onClick={handleAddComment}
                >
                  {t("send")}
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Dialog>

      {/*Edit data */}
      {tabIndex === 1 && (
        <Box maxWidth="700px" mx="auto" mt={4}>
          <Box
            sx={{
              p: 4,
              borderRadius: "4px",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 6px 20px rgba(0,0,0,0.5)"
                  : "0 6px 20px rgba(0,0,0,0.08)",
              backgroundColor:
                theme.palette.mode === "dark" ? " #121212" : "#edededff",
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              mb={3}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: theme.palette.text.primary,
              }}
            >
              {t("Modifyyourpersonaldata")}
            </Typography>

            <TextField
              label={t("name")}
              value={editData.full_name}
              onChange={(e) =>
                setEditData({ ...editData, full_name: e.target.value })
              }
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label={t("mobileNumber")}
              value={editData.phone}
              onChange={(e) =>
                setEditData({ ...editData, phone: e.target.value })
              }
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label={t("address")}
              value={editData.address}
              onChange={(e) =>
                setEditData({ ...editData, address: e.target.value })
              }
              fullWidth
              margin="normal"
              required
            />

            <Box mt={3}>
              <Typography
                variant="body2"
                mb={1}
                fontWeight="bold"
                sx={{ color: theme.palette.text.primary }}
              >
                {t("Profilepicture")}
              </Typography>

              <Box
                sx={{
                  border: `2px dashed ${theme.palette.divider}`,
                  borderRadius: "12px",
                  p: 3,
                  textAlign: "center",
                  bgcolor:
                    theme.palette.mode === "dark" ? "#1e1e1e" : "#f9fcff",
                }}
              >
                <Button variant="outlined" component="label">
                  {t("Chooseanewphoto")}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setAvatarFile(file);
                      if (file) setAvatarPreview(URL.createObjectURL(file));
                    }}
                  />
                </Button>

                {(avatarPreview || editData.avatar_url) && (
                  <Avatar
                    src={avatarPreview || editData.avatar_url}
                    sx={{
                      width: 160,
                      height: 160,
                      mt: 2,
                      mx: "auto",
                      border: `3px solid ${theme.palette.primary.main}`,
                    }}
                  />
                )}
              </Box>
            </Box>

            <Box mt={4} textAlign="center">
              <Button
                variant="contained"
                onClick={handleSaveEdit}
                sx={{
                  px: 5,
                  py: 1.5,
                  borderRadius: "30px",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                {t("Savemodifications")}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Product modification modal */}
      <Dialog
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle> {t("Modifytheproduct")}</DialogTitle>
        <DialogContent>
          <TextField
            label={t("Productname")}
            value={editValues.name}
            onChange={(e) =>
              setEditValues({ ...editValues, name: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label={t("Description")}
            value={editValues.description}
            onChange={(e) =>
              setEditValues({ ...editValues, description: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label={t("price")}
            type="number"
            value={editValues.price}
            onChange={(e) =>
              setEditValues({ ...editValues, price: e.target.value })
            }
            fullWidth
            margin="normal"
          />
          <Button variant="outlined" component="label" fullWidth sx={{ mt: 2 }}>
            {t("Chooseanewphoto")}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files[0];
                setNewImageFile(file);
                if (file) setNewImagePreview(URL.createObjectURL(file));
              }}
            />
          </Button>
          {newImagePreview && (
            <Avatar
              src={newImagePreview}
              sx={{ width: "100%", height: 200, mt: 2 }}
              variant="square"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedProduct(null)} color="secondary">
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSaveProductEdit}
            variant="contained"
            color="primary"
          >
            {t("Savemodifications")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
