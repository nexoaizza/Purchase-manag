import userStore, { IUser } from "@/store/user.store";

export const useAuth = () => userStore();

export const getAccessToken = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("access_token");
    if (stored) return stored;
  }

  return userStore.getState().access_token;
};

export const setAccessToken = (access_token: string) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("access_token", access_token);
    } catch (e) {
      console.log(e);
    }
  }
  userStore.getState().setAccessToken(access_token);
};

export const setProfile = (user: IUser) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("user", JSON.stringify(user));
    } catch (e) {
      console.log(e);
    }
  }
  userStore.getState().setProfile(user);
};

export const getProfile = (): IUser | null => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("user");
      if (stored) return JSON.parse(stored) as IUser;
    } catch (e) {
      console.log(e);
    }
  }

  return userStore.getState().user;
};

export const login = (user: IUser, access_token: string) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("access_token", access_token);
    } catch (e) {}
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("user", JSON.stringify(user));
    } catch (e) {}
  }
  userStore.getState().login(user, access_token);
};

export const logout = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
    } catch (e) {}
  }
  userStore.getState().logout();
};
