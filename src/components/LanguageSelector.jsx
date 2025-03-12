"use client";

import { Box, Button, Menu, MenuButton, MenuList, MenuItem, Text } from "@chakra-ui/react";
import { LANGUAGE_VERSIONS } from "@/constants";

const languages = Object.entries(LANGUAGE_VERSIONS);
const activeColor = "blue.400";

const LanguageSelector = ({ language, onSelect }) => {
  return (
    <Box className="flex items-center">
      <p className="mr-2">Language:</p>
      <Menu>
        <MenuButton as={Button} variant="unstyled" size="sm">
          {language}
        </MenuButton>
        <MenuList className="absolute top-12 z-10">
          {languages.map(([lang, version]) => (
            <MenuItem
              key={lang}
              onClick={() => onSelect(lang)}
              color={lang === language ? activeColor : ""}
              bg={lang === language ? "gray.900" : "transparent"}
              _hover={{
                color: activeColor,
                bg: "gray.900",
              }}
            >
              {lang}
              &nbsp;
              <Text as="span" color="gray.600" fontSize="sm">
                {version}
              </Text>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};

export default LanguageSelector;