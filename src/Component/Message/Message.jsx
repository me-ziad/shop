import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import {Box,Typography,TextField,Button,List,ListItem,ListItemAvatar,Avatar,ListItemText,Divider,} from "@mui/material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { useMediaQuery, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

export default function Message() {
  const isSmallScreen = useMediaQuery("(max-width:900px)");
  const theme = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { otherUserId } = useParams();
  const product = location.state?.product;
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const showSidebar = !isSmallScreen || !otherUserId;
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [productImageVisible, setProductImageVisible] = useState(true);
// Set the page title to "Messages" when the component mounts
useEffect(() => {
  document.title = t('messages');
}, []);

// Fetch the current authenticated user and store it in state
useEffect(() => {
  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  };
  getUser();
}, []);

// If a product is passed, prefill the message input with product details
useEffect(() => {
  if (product) {
    const initialMessage = ` المنتج :  ${product.name}
 السعر  :   ${product.price} جنيه 
 الوصف  :   ${
      product.description?.trim() ? product.description : "لا يوجد وصف"
    }`;
    setNewMessage(initialMessage);
  }
}, [product]);

// Mark all unread messages for the current user as read and update unread count in localStorage
const markMessagesAsRead = async () => {
  const { data, error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", currentUser.id)
    .eq("is_read", false);

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", currentUser.id)
    .eq("is_read", false);

  localStorage.setItem("forceUnreadCount", count || 0);
};

// Fetch all messages exchanged between the current user and the selected contact
const fetchMessages = async () => {
  if (!otherUserId || !currentUser) return;

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`
    )
    .order("created_at", { ascending: true });

  if (!error) {
    setMessages(data);
  }
};

// Fetch all contacts the current user has messaged or received messages from
const fetchContacts = async () => {
  if (!currentUser) return;

  const { data: sentMessages } = await supabase
    .from("messages")
    .select("id, message, created_at, receiver_id")
    .eq("sender_id", currentUser.id);

  const { data: receivedMessages } = await supabase
    .from("messages")
    .select("id, message, created_at, sender_id, is_read")
    .eq("receiver_id", currentUser.id);

  const userIds = new Set();

  sentMessages?.forEach((msg) => {
    if (msg.receiver_id && msg.receiver_id !== currentUser.id) {
      userIds.add(msg.receiver_id);
    }
  });

  receivedMessages?.forEach((msg) => {
    if (msg.sender_id && msg.sender_id !== currentUser.id) {
      userIds.add(msg.sender_id);
    }
  });

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", Array.from(userIds));

  const userMap = {};

  users.forEach((user) => {
    const lastSent = sentMessages
      ?.filter((m) => m.receiver_id === user.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    const lastReceived = receivedMessages
      ?.filter((m) => m.sender_id === user.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    const lastMessage = lastSent || lastReceived;

    const unreadCount = receivedMessages?.filter(
      (m) => m.sender_id === user.id && !m.is_read
    ).length;

    userMap[user.id] = {
      ...user,
      lastMessage: lastMessage?.message || "",
      lastTime: lastMessage?.created_at || "",
      unreadCount,
    };
  });

  const sortedContacts = Object.values(userMap).sort(
    (a, b) => new Date(b.lastTime) - new Date(a.lastTime)
  );
  setContacts(sortedContacts);
};

// Fetch contacts once the current user is available
useEffect(() => {
  if (currentUser) {
    fetchContacts();
  }
}, [currentUser]);

// If no contact is selected, automatically navigate to the most recent one
useEffect(() => {
  if (!otherUserId && contacts.length > 0) {
    navigate(`/message/${contacts[0].id}`, { replace: true });
  }
}, [contacts, otherUserId]);

// Load messages and contacts, and mark messages as read when both users are available
useEffect(() => {
  if (!currentUser || !otherUserId) return;

  const loadMessages = async () => {
    // 1. Mark messages as read
    await markMessagesAsRead(otherUserId);

    // 2. Wait briefly for Supabase to update
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 3. Get updated unread count
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", currentUser.id)
      .eq("is_read", false);

    // 4. Store unread count in localStorage
    localStorage.setItem("forceUnreadCount", count || 0);

    // 5. Fetch messages and contacts
    await fetchMessages();
    await fetchContacts();
  };

  loadMessages();
}, [currentUser, otherUserId]);

// Subscribe to real-time message updates using Supabase channel
useEffect(() => {
  if (!currentUser) return;

  const channel = supabase
    .channel("live-chat")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const msg = payload.new;
        if (
          (msg.sender_id === currentUser.id &&
            msg.receiver_id === otherUserId) ||
          (msg.sender_id === otherUserId &&
            msg.receiver_id === currentUser.id)
        ) {
          setMessages((prev) => [...prev, msg]);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentUser, otherUserId]);

// Send a new message, optionally including product image if visible
const sendMessage = async () => {
  if (!newMessage.trim() || !otherUserId) return;

  let finalMessage = newMessage;

  if (product?.image_url && productImageVisible) {
    finalMessage += `\n صورة المنتج:\n${product.image_url}`;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: currentUser.id,
      receiver_id: otherUserId,
      message: finalMessage,
      is_read: false,
    })
    .select();

  if (!error && data && data.length > 0) {
    setMessages((prev) => [...prev, data[0]]);
  }

  setNewMessage("");
  setProductImageVisible(false);
};

  return (
    <Box
      display="flex"
      sx={{ height: { xs: "85vh", md: "90vh" } }}
      height="90vh"
      bgcolor={theme.palette.background.default}
      position="relative"
    >
      {/* ✅ Open side menu button */}
      <IconButton
        onClick={() => setSidebarVisible(true)}
        sx={{
          position: "absolute",
          top: 0,
          [theme.direction === "rtl" ? "right" : "left"]: 9,
          zIndex: 3,
          display: { xs: sidebarVisible ? "none" : "flex", md: "none" },
          bgcolor: theme.palette.primary.main,
          color: "#fff",
          boxShadow: 3,
          borderRadius: "50%",
          width: 40,
          height: 40,
          "&:hover": {
            bgcolor: theme.palette.primary.dark,
          },
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* ✅ Side menu */}
      <Box
        sx={{cursor:'pointer',
          width: {
            xs: sidebarVisible ? "200px" : "0px",
            sm: sidebarVisible ? "200px" : "0px",
            md: "340px",
          },
          bgcolor:
            theme.palette.mode === "dark" ? theme.palette.grey[900] : "#fff",
          boxShadow: 2,
          transition: "width 0.3s ease",
          position: { xs: "absolute", md: "static" },
          top: { xs: "-22px", md: "auto" },
          height: { xs: "75vh", md: "90vh" },
          zIndex: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden", //
        }}
      >
        {/* ✅ Fully hideable content on small screens */}
        <Box
          sx={{
            display:
              sidebarVisible || theme.breakpoints.up("md") ? "block" : "none",
          }}
        >
          {/* Close button on small screens only */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              justifyContent:
                theme.direction === "rtl" ? "flex-end" : "flex-start",
              px: 2,
              pt: 2,
              mt: 3,
            }}
          >
            <IconButton
              onClick={() => setSidebarVisible(false)}
              sx={{
                bgcolor: theme.palette.error.main,
                color: "#fff",
                boxShadow: 3,
                borderRadius: "50%",
                width: 30,
                height: 30,
                transition: "0.2s",
                "&:hover": {
                  bgcolor: theme.palette.error.dark,
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Typography
            variant="h6"
            p={2}
            sx={{ color: theme.palette.text.primary }}
          >
            {t("Conversations")}
          </Typography>
          <Divider />
        </Box>

        {/* ✅ Scroll داخلي فقط لقائمة الشاتات */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <List>
            {contacts.map((user) => (
              <ListItem
                key={user.id}
                selected={user.id === otherUserId}
                onClick={() => {
                  navigate(`/message/${user.id}`);
                  setSidebarVisible(false);
                }}
                sx={{
                  alignItems: "flex-start",
                  bgcolor:
                    user.id === otherUserId
                      ? theme.palette.mode === "dark"
                        ? "#1e3a5f"
                        : "#e3f2fd"
                      : theme.palette.mode === "dark"
                      ? theme.palette.grey[900]
                      : "#fff",
                  transition: "0.2s",
                  "&:hover": {
                    bgcolor:
                      theme.palette.mode === "dark" ? "#2a2a2a" : "#f5f5f5",
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar src={user.avatar_url || "/default-avatar.png"} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography sx={{ color: theme.palette.text.primary }}>
                        {user.full_name}
                      </Typography>
                      {user.unreadCount > 0 && user.id !== otherUserId && (
                        <Box
                          sx={{
                            bgcolor: theme.palette.primary.main,
                            color: "#fff",
                            borderRadius: "50%",
                            width: 22,
                            height: 22,
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {user.unreadCount}
                        </Box>
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {user.lastMessage?.slice(0, 30)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>

      {/*   Messages Area */}
      <Box flex={1} display="flex" flexDirection="column">
        {otherUserId ? (
          <>
            <Box flex={1} p={2} overflow="auto">
              {messages.map((msg) => {
                const hasImage = msg.message.includes("صورة المنتج:");
                const imageUrl = hasImage
                  ? msg.message.split("صورة المنتج:\n")[1]?.trim()
                  : null;
                const textOnly = hasImage
                  ? msg.message.split("صورة المنتج:")[0].trim()
                  : msg.message;

                const isSender = msg.sender_id === currentUser?.id;
                const bubbleBg = isSender
                  ? theme.palette.mode === "dark"
                    ? "#223e1bff"
                    : theme.palette.primary.main
                  : theme.palette.mode === "dark"
                  ? "#2a2a2a"
                  : "#eee";

                const bubbleColor = isSender
                  ? "#fff"
                  : theme.palette.text.primary;

                return (
                  <Box
                    key={msg.id}
                    sx={{ textAlign: isSender ? "right" : "left", mb: 2 }}
                  >
                    <Box
                      sx={{
                        display: "inline-block",
                        bgcolor: bubbleBg,
                        color: bubbleColor,
                        width: "100%",
                        maxWidth: "50vw",
                        p: 1.5,
                        borderRadius: 3,
                        boxShadow: 2,
                        overflow: "hidden",
                      }}
                    >
                      {hasImage && imageUrl ? (
                        <Box>
                          <Box
                            component="img"
                            src={imageUrl}
                            alt="صورة المنتج"
                            sx={{
                              width: "100%",
                              maxHeight: 160,
                              objectFit: "cover",
                              borderRadius: 2,
                              mb: 1,
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: "pre-line",
                              wordBreak: "break-word",
                              fontSize: "14px",
                            }}
                          >
                            {textOnly}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography
                          sx={{
                            whiteSpace: "pre-line",
                            wordBreak: "break-word",
                            fontSize: "14px",
                          }}
                        >
                          {msg.message}
                        </Typography>
                      )}
                      {isSender && (
                        <span style={{ marginLeft: 8 }}>
                          {msg.is_read ? (
                            <DoneAllIcon fontSize="small" />
                          ) : (
                            <DoneIcon fontSize="small" />
                          )}
                        </span>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/*  Enter message */}
            <Box
              display="flex"
              flexDirection="column"
              gap={1}
              p={1}
              bgcolor={theme.palette.background.paper}
              boxShadow={2}
            >
              {product?.image_url && productImageVisible && (
                <Box
                  component="img"
                  src={product.image_url}
                  alt={product.name}
                  sx={{
                    width: "100%",
                    maxHeight: 160,
                    objectFit: "cover",
                    borderRadius: 2,
                    mb: 1,
                  }}
                />
              )}

              <TextField
                fullWidth
                multiline
                minRows={1}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t("Writeyourmessage")}
                sx={{
                  "& .MuiInputBase-root": {
                    bgcolor: theme.palette.mode === "dark" ? "#3a3a3a" : "#fff",
                    color: theme.palette.text.primary,
                    fontSize: { xs: "13px", md: "16px" },
                    padding: { xs: "6px 10px", md: "10px 14px" },
                    minHeight: { xs: 36, md: 48 },
                  },
                }}
              />

              <Button
                variant="contained"
                onClick={sendMessage}
                sx={{
                  fontSize: { xs: "13px", md: "16px" },
                  padding: { xs: "4px 12px", md: "8px 20px" },
                  minHeight: { xs: 36, md: 44 },
                }}
              >
                {t("send")}
              </Button>
            </Box>
          </>
        ) : (
          <Box
            flex={1}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Typography color="text.secondary">
              {t("Chooseaconversationfromthelist")}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
