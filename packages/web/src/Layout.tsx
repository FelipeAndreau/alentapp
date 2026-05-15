 1 import { Provider } from './components/ui/provider';
    2 import { Box, Container, Flex, Text, HStack } from '@chakra-ui/react';
    3 import { Toaster } from './components/ui/toaster';
    4
    5 import { Outlet, Link as RouterLink } from "react-router";
    6
    7 function Layout() {
    8     return (
    9         <Provider>
   10             <Toaster />
   11             <Box as="nav" borderBottomWidth="1px" py="4" px="8"
      bg="bg.panel" boxShadow="sm" position="sticky" top="0" zIndex="docked">
   12                 <Flex justify="space-between" align="center" maxW="7xl"
      mx="auto">
   13                     <RouterLink to="/">
   14                         <Text
   15                             fontSize="2xl"
   16                             fontWeight="bold"
   17                             bgGradient="to-r"
   18                             gradientFrom="blue.600"
   19                             gradientTo="cyan.500"
   20                             bgClip="text"
   21                         >
   22                             Alentapp
   23                         </Text>
   24                     </RouterLink>
   25                     <HStack gap="10">
   26                         <RouterLink to="/members">
   27                             <Text
   28                                 fontWeight="semibold"
   29                                 fontSize="sm"
   30                                 textTransform="uppercase"
   31                                 letterSpacing="wider"
   32                                 color="fg.muted"
   33                                 _hover={{ color: "blue.500",
      textDecoration: "none" }}
   34                             >
   35                                 Miembros
   36                             </Text>
   37                         </RouterLink>
   38                         <RouterLink to="/payments">
   39                             <Text
   40                                 fontWeight="semibold"
   41                                 fontSize="sm"
   42                                 textTransform="uppercase"
   43                                 letterSpacing="wider"
   44                                 color="fg.muted"
   45                                 _hover={{ color: "blue.500",
      textDecoration: "none" }}
   46                             >
   47                                 Pagos
   48                             </Text>
   49                         </RouterLink>
   50                         <RouterLink to="/disciplines">
   51                             <Text
   52                                 fontWeight="semibold"
   53                                 fontSize="sm"
   54                                 textTransform="uppercase"
   55                                 letterSpacing="wider"
   56                                 color="fg.muted"
   57                                 _hover={{ color: "blue.500",
      textDecoration: "none" }}
   58                             >
   59                                 Disciplinas
   60                             </Text>
   61                         </RouterLink>
   62                         <RouterLink to="/lockers">
   63                             <Text
   64                                 fontWeight="semibold"
   65                                 fontSize="sm"
   66                                 textTransform="uppercase"
   67                                 letterSpacing="wider"
   68                                 color="fg.muted"
   69                                 _hover={{ color: "blue.500",
      textDecoration: "none" }}
   70                             >
   71                                 Casilleros
   72                             </Text>
   73                         </RouterLink>
   74                     </HStack>
   75                 </Flex>
   76             </Box>
   77             <Container maxW="7xl" py="10">
   78                 <Outlet />
   79             </Container>
   80         </Provider>
   81     );
   82 }
   83
   84 export default Layout;

