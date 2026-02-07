"use client";

import {
  Autocomplete,
  Avatar,
  CircularProgress,
  InputAdornment,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { Fragment } from "react";
import { getRandomAvatarUrl } from "@/utils/avatar";

interface UserOption {
  id: string;
  name: string;
  image: string | null;
}

export default function SearchBlock({
  options,
  isLoading,
  onSearchUsers,
  onSelectedUser,
}: {
  options: UserOption[];
  isLoading: boolean;
  onSearchUsers: (query: string) => void;
  onSelectedUser: (userId: string) => void;
}) {
  return (
    <Autocomplete
      options={options}
      onOpen={()=>onSearchUsers('')}
      loading={isLoading}
      getOptionLabel={(opt) => opt.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      onInputChange={(_e, value) => onSearchUsers(value)}
      onChange={(_e, opt) => opt && onSelectedUser(opt.id)}
      renderOption={(props, option) => {
        const { key: _key, ...restProps } = props;
        return (
          <ListItem key={option.id} {...restProps}>
            <ListItemAvatar>
              <Avatar src={option.image ?? getRandomAvatarUrl(option.id)} alt={option.name} />
            </ListItemAvatar>
            <ListItemText primary={option.name} />
          </ListItem>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          placeholder="搜尋使用者..."
          size="small"
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: 999 },
          }}
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <Fragment>
                  {isLoading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </Fragment>
              ),
            },
          }}
        />
      )}
    />
  );
}
